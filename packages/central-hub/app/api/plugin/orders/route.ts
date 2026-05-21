import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { ordersRequestSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const GET = withTenantAuthentication(
  async (request: Request, tenant: any) => {
    try {
      const { searchParams } = new URL(request.url);
      const limitParam = searchParams.get('limit');
      const offsetParam = searchParams.get('offset');

      // Validate using Zod
      const parsed = ordersRequestSchema.parse({
        limit: limitParam ? parseInt(limitParam, 10) : undefined,
        offset: offsetParam ? parseInt(offsetParam, 10) : undefined
      });

      const orders = await prisma.order.findMany({
        where: { tenantId: tenant.id },
        include: {
          customer: {
            select: {
              email: true,
              name: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parsed.limit,
        skip: parsed.offset
      });

      const total = await prisma.order.count({
        where: { tenantId: tenant.id }
      });

      return NextResponse.json({ success: true, orders, total });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { error: 'Invalid request', details: error.errors },
          { status: 400 }
        );
      }
      console.error('Error fetching orders:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);