import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { createSubscriptionRequestSchema } from '@/lib/validation';
import { StripeService } from '@/lib/stripe';
import { z } from 'zod';

export const POST = withTenantAuthentication(
  async (request: Request, tenant: any) => {
    try {
      const body = await request.json();
      const parsed = createSubscriptionRequestSchema.parse(body);

      const stripeService = new StripeService();
      const result = await stripeService.createCheckoutSession({
        tenantId: tenant.id,
        priceId: parsed.priceId,
        customerEmail: parsed.customerEmail,
        successUrl: parsed.successUrl,
        cancelUrl: parsed.cancelUrl,
        metadata: parsed.metadata
      });

      return NextResponse.json({
        success: true,
        orderId: result.orderId,
        checkoutUrl: result.checkoutUrl
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error creating subscription checkout:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);