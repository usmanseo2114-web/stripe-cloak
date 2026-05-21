import Stripe from 'stripe';
import { prisma } from './prisma';

let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripe) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
  }
  return stripe;
}

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = getStripe();
  }

  // Create a Checkout Session for one-time payment
  async createCheckoutSession(params: {
    tenantId: string;
    priceId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) {
    // Verify the price belongs to the tenant
    const price = await prisma.product.findUnique({
      where: { stripePriceId: params.priceId },
      include: { tenant: true }
    });

    if (!price || price.tenantId !== params.tenantId) {
      throw new Error('Invalid price ID for this tenant');
    }

    // Create or retrieve Stripe customer
    let stripeCustomerId: string;
    const existingCustomer = await prisma.customer.findFirst({
      where: {
        tenantId: params.tenantId,
        email: params.customerEmail
      }
    });

    if (existingCustomer) {
      stripeCustomerId = existingCustomer.stripeCustomerId;
    } else {
      const stripeCustomer = await this.stripe.customers.create({
        email: params.customerEmail,
        metadata: {
          tenantId: params.tenantId,
          ...params.metadata
        }
      });

      stripeCustomerId = stripeCustomer.id;

      // Save customer to our database
      await prisma.customer.create({
        data: {
          tenantId: params.tenantId,
          stripeCustomerId: stripeCustomer.id,
          email: params.customerEmail,
          name: params.metadata?.name || undefined,
          metadata: params.metadata
        }
      });
    }

    // Create Checkout Session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      mode: params.billingType === 'subscription' ? 'subscription' : 'payment',
      customer: stripeCustomerId,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      metadata: {
        tenantId: params.tenantId,
        ...params.metadata
      }
    });

    // Create order record
    const order = await prisma.order.create({
      data: {
        tenantId: params.tenantId,
        customerId: existingCustomer?.id || '',
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId: session.payment_intent as string || '',
        amount: price.amount,
        currency: price.currency,
        status: 'pending',
        metadata: params.metadata
      }
    });

    return {
      sessionId: session.id,
      checkoutUrl: session.url,
      orderId: order.id
    };
  }

  // Create a subscription
  async createSubscription(params: {
    tenantId: string;
    priceId: string;
    customerEmail: string;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }) {
    return this.createCheckoutSession({
      ...params,
      // For subscriptions, we'll use Checkout in subscription mode
    });
  }

  // Cancel a subscription
  async cancelSubscription(subscriptionId: string) {
    // Verify subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel at period end (could also cancel immediately)
    const stripeSubscription = await this.stripe.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true }
    );

    // Update our record
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true }
    });

    return stripeSubscription;
  }

  // Create a refund
  async createRefund(params: {
    orderId: string;
    amount?: number; // in cents, if not provided refunds full amount
    reason?: string;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: params.orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify order has a payment intent
    if (!order.stripePaymentIntentId) {
      throw new Error('Order has no payment intent to refund');
    }

    const refund = await this.stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
      amount: params.amount,
      reason: params.reason
    });

    // Update order status
    await prisma.order.update({
      where: { id: params.orderId },
      data: { status: 'refunded' }
    });

    return refund;
  }

  // Get order status
  async getOrderStatus(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Optionally, we could fetch latest status from Stripe
    // but for now we'll return what we have in our DB
    return {
      id: order.id,
      status: order.status,
      amount: order.amount,
      currency: order.currency,
      createdAt: order.createdAt,
      stripePaymentIntentId: order.stripePaymentIntentId,
      stripeSubscriptionId: order.stripeSubscriptionId
    };
  }

  // Handle webhook event
  async handleWebhookEvent(event: Stripe.Event) {
    // Check if we've already processed this event
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { stripeEventId: event.id }
    });

    if (existingEvent) {
      // Already processed
      return existingEvent;
    }

    // Process based on event type
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'customer.subscription.created':
        await this.handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        stripeEventId: event.id,
        type: event.type,
        processed: true,
        payload: event
      }
    });

    return webhookEvent;
  }

  // Webhook handlers
  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    // Update order status to paid
    if (session.metadata?.tenantId && session.id) {
      await prisma.order.updateMany({
        where: {
          stripeCheckoutSessionId: session.id,
          tenantId: session.metadata.tenantId
        },
        data: { status: 'paid' }
      });
    }

    // If subscription, create subscription record
    if (session.subscription) {
      await this.handleSubscriptionCreated(
        await this.stripe.subscriptions.retrieve(session.subscription as string)
      );
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Update order status
    if (paymentIntent.metadata?.tenantId && paymentIntent.id) {
      await prisma.order.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
          tenantId: paymentIntent.metadata.tenantId as string
        },
        data: { status: 'paid' }
      });
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Update order status
    if (paymentIntent.metadata?.tenantId && paymentIntent.id) {
      await prisma.order.updateMany({
        where: {
          stripePaymentIntentId: paymentIntent.id,
          tenantId: paymentIntent.metadata.tenantId as string
        },
        data: { status: 'failed' }
      });
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    // Find or create customer
    const customer = await prisma.customer.findUnique({
      where: { stripeCustomerId: subscription.customer as string }
    });

    if (!customer) {
      console.warn(`Customer not found for subscription: ${subscription.id}`);
      return;
    }

    // Check if subscription already exists
    const existingSubscription = await prisma.subscription.findUnique({
      where: { stripeSubscriptionId: subscription.id }
    });

    if (existingSubscription) {
      // Update existing
      await prisma.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });
    } else {
      // Create new
      await prisma.subscription.create({
        data: {
          tenantId: customer.tenantId,
          customerId: customer.id,
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end
        }
      });
    }
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: {
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      }
    });
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await prisma.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: 'canceled' }
    });
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    // Update subscription status if needed
    if (invoice.subscription) {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'active' }
      });
    }
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    // Update subscription status
    if (invoice.subscription) {
      await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: invoice.subscription as string },
        data: { status: 'past_due' }
      });
    }
  }

  private async handleChargeRefunded(charge: Stripe.Charge) {
    // Find order by payment intent and update status
    if (charge.payment_intent) {
      await prisma.order.updateMany({
        where: { stripePaymentIntentId: charge.payment_intent as string },
        data: { status: 'refunded' }
      });
    }
  }
}