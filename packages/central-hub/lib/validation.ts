import { z } from 'zod';

export const createCheckoutRequestSchema = z.object({
  priceId: z.string(),
  customerEmail: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.string()).optional()
});

export const createSubscriptionRequestSchema = z.object({
  priceId: z.string(),
  customerEmail: z.string().email(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  metadata: z.record(z.string()).optional()
});

export const cancelSubscriptionRequestSchema = z.object({
  subscriptionId: z.string()
});

export const refundRequestSchema = z.object({
  orderId: z.string(),
  amount: z.number().int().positive().optional(),
  reason: z.string().optional()
});

export const orderStatusRequestSchema = z.object({
  orderId: z.string()
});

export const ordersRequestSchema = z.object({
  limit: z.number().int().positive().optional().default(10),
  offset: z.number().int().nonnegative().optional().default(0)
});

export const revenueRequestSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});