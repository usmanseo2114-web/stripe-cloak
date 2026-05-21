import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { orderStatusRequestSchema } from '@/lib/validation';
import { StripeService } from '@/lib/stripe';
import { z } from 'zod';

export const GET = withTenantAuthentication(
  async (request: Request, tenant: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const orderId = searchParams.get('orderId');

      // Validate using Zod
      const parsed = orderStatusRequestSchema.parse({ orderId });

      const stripeService = new StripeService();
      const order = await stripeService.getOrderStatus(parsed.orderId);

      return NextResponse.json({ success: true, order });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error getting order status:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);