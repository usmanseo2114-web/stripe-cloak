import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { StripeService } from '@/lib/stripe';

export const config = {
  api: {
    bodyParser: false, // Important: Stripe requires raw body for signature verification
  },
};

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let stripe: Stripe;
  try {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  } catch (err) {
    console.error('❌ Error initializing Stripe:', err);
    return NextResponse.json({ received: false }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err);
    return NextResponse.json(
      { error: `Webhook Error: ${err instanceof Error ? err.message : 'Unknown Error'}` },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    const stripeService = new StripeService();
    await stripeService.handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`⚠️  Webhook handler failed.`, err);
    return NextResponse.json(
      { error: `Webhook Handler Error` },
      { status: 500 }
    );
  }
}