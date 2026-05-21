import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { refundRequestSchema } from '@/lib/validation';
import { StripeService } from '@/lib/stripe';
import { z } from 'zod';

export const POST = withTenantAuthentication(
  async (request: Request, tenant: any) => {
    try {
      const body = await request.json();
      const parsed = refundRequestSchema.parse(body);

      const stripeService = new StripeService();
      const refund = await stripeService.createRefund({
        orderId: parsed.orderId,
        amount: parsed.amount,
        reason: parsed.reason
      });

      return NextResponse.json({ success: true, refund });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error creating refund:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);