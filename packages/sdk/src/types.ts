export interface StripeGatewayOptions {
  apiKey: string;
  baseUrl: string;
}

export interface CreateCheckoutData {
  priceId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutResult {
  success: boolean;
  orderId: string;
  checkoutUrl: string;
}

export interface CreateSubscriptionData extends CreateCheckoutData {}

export interface CancelSubscriptionData {
  subscriptionId: string;
}

export interface RefundData {
  orderId: string;
  amount?: number; // in cents
}

export interface OrderStatusData {
  orderId: string;
}

export interface OrderStatusResult {
  success: boolean;
  orderId: string;
  status: string;
  amount: number; // in cents
  currency: string;
  createdAt: string;
}

export interface OrdersResult {
  success: boolean;
  orders: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
    customerEmail?: string;
  }>;
  total: number;
}

export interface RevenueResult {
  success: boolean;
  revenue: {
    total: Record<string, number>; // currency => amount in cents
    mrr: number; // in cents
    failedPayments: number;
    refunds: number; // in cents
  };
}