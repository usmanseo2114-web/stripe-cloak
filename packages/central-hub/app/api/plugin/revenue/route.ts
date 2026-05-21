import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { revenueRequestSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const GET = withTenantAuthentication(
  async (request: Request, tenant: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');

      // Validate using Zod
      const parsed = revenueRequestSchema.parse({
        startDate: startDateParam ? new Date(startDateParam) : undefined,
        endDate: endDateParam ? new Date(endDateParam) : undefined
      });

      // Build date filter
      const dateFilter: any = {};
      if (parsed.startDate) {
        dateFilter.gte = parsed.startDate;
      }
      if (parsed.endDate) {
        dateFilter.lte = parsed.endDate;
      }

      // Calculate total revenue (sum of amounts for paid/refunded orders? We'll consider paid and refunded as completed)
      // For simplicity, we'll sum the amount of orders with status 'paid' or 'refunded' (refunded might be negative, but we store positive amount and refund separately)
      // In a real system, we might have a separate table for refunds or negative amounts. Here, we'll just sum paid orders.
      const paidOrders = await prisma.order.findMany({
        where: {
          tenantId: tenant.id,
          status: 'paid',
          createdAt: dateFilter
        },
        select: { amount: true, currency: true }
      });

      // Group by currency
      const revenueByCurrency = paidOrders.reduce((acc, order) => {
        const currency = order.currency;
        acc[currency] = (acc[currency] || 0) + order.amount;
        return acc;
      }, {} as Record<string, number>);

      // Calculate Monthly Recurring Revenue (MRR) from active subscriptions
      const activeSubscriptions = await prisma.subscription.findMany({
        where: {
          tenantId: tenant.id,
          status: 'active',
          currentPeriodEnd: { gte: new Date() } // Still active in the future
        },
        select: {
          stripeSubscriptionId: true,
          customerId: true
        }
      });

      // For each subscription, we need to get the plan amount (we don't have it directly, so we would need to look up the price)
      // Since we don't have a direct link from subscription to price, we can't compute MRR without more data.
      // We'll skip MRR for now and note that we would need to store the price ID or amount on the subscription.
      // Alternatively, we could retrieve the subscription from Stripe, but that would be slow.
      // For the sake of this example, we'll set MRR to 0 and note that it requires enhancement.

      // Failed payments (failed orders)
      const failedOrders = await prisma.order.count({
        where: {
          tenantId: tenant.id,
          status: 'failed',
          createdAt: dateFilter
        }
      });

      // Refunds (we don't have a separate refund table, so we cannot compute refund totals accurately)
      // We'll set refunds to 0 and note that we would need to store refunds separately.

      return NextResponse.json({
        success: true,
        revenue: {
          total: revenueByCurrency,
          mrr: 0, // Placeholder
          failedPayments: failedOrders,
          refunds: 0 // Placeholder
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error fetching revenue:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);