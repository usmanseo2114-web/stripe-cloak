import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { cancelSubscriptionRequestSchema } from '@/lib/validation';
import { StripeService } from '@/lib/stripe';
import { z } from 'zod';

export const POST = withTenantAuthentication(
  async (request: Request, tenant: any) => {
    try {
      const body = await request.json();
      const parsed = cancelSubscriptionRequestSchema.parse(body);

      const stripeService = new StripeService();
      await stripeService.cancelSubscription(parsed.subscriptionId);

      return NextResponse.json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error canceling subscription:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);