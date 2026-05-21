import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { StripeService } from '@/lib/stripe';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mPrismaClient = {
    product: {
      findUnique: jest.fn()
    },
    customer: {
      findFirst: jest.fn(),
      create: jest.fn()
    },
    order: {
      create: jest.fn()
    },
    subscription: {
      updateMany: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn()
    },
    webhookEvent: {
      findUnique: jest.fn(),
      create: jest.fn()
    },
    tenant: {
      findUnique: jest.fn()
    }
  };
  return { PrismaClient: jest.fn(() => mPrismaClient) };
});

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => {
    return {
      customers: {
        create: jest.fn()
      },
      checkout: {
        sessions: {
          create: jest.fn()
        }
      },
      subscriptions: {
        update: jest.fn(),
        retrieve: jest.fn()
      },
      refunds: {
        create: jest.fn()
      }
    };
  });
});

describe('StripeService', () => {
  let stripeService: StripeService;
  let mockedPrisma: any;
  let mockedStripe: any;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Get the mocked PrismaClient instance
    mockedPrisma = new PrismaClient();

    // Create a StripeService instance
    stripeService = new StripeService();

    // Get the mocked Stripe instance (the constructor is mocked)
    mockedStripe = (Stripe as jest.Mock).mock.instances[0];
  });

  describe('createCheckoutSession', () => {
    it('should create a checkout session for a one-time payment', async () => {
      // Arrange
      const priceId = 'price_123';
      const customerEmail = 'test@example.com';
      const successUrl = 'https://example.com/success';
      const cancelUrl = 'https://example.com/cancel';
      const metadata = { website: 'test-site' };

      // Mock product lookup
      (mockedPrisma.product.findUnique as jest.Mock).mockResolvedValue({
        id: 'prod_123',
        tenantId: 'tenant_123',
        stripeProductId: 'prod_123',
        stripePriceId: priceId,
        name: 'Test Product',
        description: 'A test product',
        amount: 1000,
        currency: 'usd',
        billingType: 'one_time',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock customer lookup (not found)
      (mockedPrisma.customer.findFirst as jest.Mock).mockResolvedValue(null);

      // Mock customer creation
      (mockedPrisma.customer.create as jest.Mock).mockResolvedValue({
        id: 'cus_123',
        tenantId: 'tenant_123',
        stripeCustomerId: 'cus_123',
        email: customerEmail,
        name: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Mock Stripe customer creation
      (mockedStripe.customers.create as jest.Mock).mockResolvedValue({
        id: 'cus_stripe_123',
        email: customerEmail
      });

      // Mock Stripe checkout session creation
      (mockedStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({
        id: 'cs_123',
        url: 'https://checkout.stripe.com/pay/cs_123',
        payment_intent: 'pi_123'
      });

      // Mock order creation
      (mockedPrisma.order.create as jest.Mock).mockResolvedValue({
        id: 'ord_123',
        tenantId: 'tenant_123',
        customerId: 'cus_123',
        stripeCheckoutSessionId: 'cs_123',
        stripePaymentIntentId: 'pi_123',
        stripeSubscriptionId: null,
        amount: 1000,
        currency: 'usd',
        status: 'pending',
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Act
      const result = await stripeService.createCheckoutSession({
        tenantId: 'tenant_123',
        priceId,
        customerEmail,
        successUrl,
        cancelUrl,
        metadata
      });

      // Assert
      expect(result).toEqual({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
        orderId: 'ord_123'
      });

      // Verify that the product was looked up for the tenant
      expect(mockedPrisma.product.findUnique).toHaveBeenCalledWith({
        where: { stripePriceId: priceId },
        include: { tenant: true }
      });

      // Verify that customer lookup was performed
      expect(mockedPrisma.customer.findFirst).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant_123',
          email: customerEmail
        }
      });

      // Verify that a customer was created in our DB (since not found)
      expect(mockedPrisma.customer.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant_123',
          stripeCustomerId: 'cus_stripe_123',
          email: customerEmail,
          name: undefined,
          metadata: undefined
        }
      });

      // Verify that Stripe customer was created
      expect(mockedStripe.customers.create).toHaveBeenCalledWith({
        email: customerEmail,
        metadata: {
          tenantId: 'tenant_123',
          ...metadata
        }
      });

      // Verify that checkout session was created
      expect(mockedStripe.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'payment',
        customer: 'cus_stripe_123',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          tenantId: 'tenant_123',
          ...metadata
        }
      });

      // Verify that order was created
      expect(mockedPrisma.order.create).toHaveBeenCalledWith({
        data: {
          tenantId: 'tenant_123',
          customerId: 'cus_123', // This is the customer id from our DB, not Stripe
          stripeCheckoutSessionId: 'cs_123',
          stripePaymentIntentId: 'pi_123',
          stripeSubscriptionId: null,
          amount: 1000,
          currency: 'usd',
          status: 'pending',
          metadata: undefined
        }
      });
    });
  });
});