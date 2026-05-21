import type {
  StripeGatewayOptions,
  CreateCheckoutData,
  CreateCheckoutResult,
  CreateSubscriptionData,
  CancelSubscriptionData,
  RefundData,
  OrderStatusData,
  OrderStatusResult,
  OrdersResult,
  RevenueResult
} from './types';

/**
 * Stripe Gateway SDK
 * A client for interacting with the Stripe Gateway Hub API
 */
export class StripeGateway {
  private apiKey: string;
  private baseUrl: string;

  constructor(options: StripeGatewayOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl.replace(/\/+$/, ''); // Remove trailing slash
  }

  /**
   * Check connection to the hub
   */
  async connect(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/plugin/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to connect to Stripe Gateway Hub:', error);
      return false;
    }
  }

  /**
   * Create a Checkout Session for one-time payment or subscription
   * @param data - Checkout data
   * @returns Checkout session URL and order ID
   */
  async createCheckout(data: CreateCheckoutData): Promise<CreateCheckoutResult> {
    const response = await fetch(`${this.baseUrl}/api/plugin/create-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    return response.json();
  }

  /**
   * Create a subscription (uses the same endpoint as create-checkout for simplicity)
   * @param data - Subscription data
   * @returns Checkout session URL and order ID
   */
  async createSubscription(data: CreateSubscriptionData): Promise<CreateCheckoutResult> {
    return this.createCheckout(data);
  }

  /**
   * Cancel a subscription
   * @param data - Cancellation data
   * @returns Success status
   */
  async cancelSubscription(data: CancelSubscriptionData): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/api/plugin/cancel-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel subscription');
    }

    return response.json();
  }

  /**
   * Refund a payment
   * @param data - Refund data
   * @returns Refund object
   */
  async refund(data: RefundData): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/plugin/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create refund');
    }

    return response.json();
  }

  /**
   * Get order status
   * @param data - Order status data
   * @returns Order status
   */
  async getOrderStatus(data: OrderStatusData): Promise<OrderStatusResult> {
    const url = new URL(`${this.baseUrl}/api/plugin/order-status`);
    url.searchParams.set('orderId', data.orderId);

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get order status');
    }

    return response.json();
  }

  /**
   * Get list of orders for the tenant
   * @param limit - Maximum number of orders to return (optional)
   * @param offset - Number of orders to skip (optional)
   * @returns Orders list and total count
   */
  async getOrders(limit?: number, offset?: number): Promise<OrdersResult> {
    const url = new URL(`${this.baseUrl}/api/plugin/orders`);
    if (limit !== undefined) url.searchParams.set('limit', limit.toString());
    if (offset !== undefined) url.searchParams.set('offset', offset.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get orders');
    }

    return response.json();
  }

  /**
   * Get revenue analytics for the tenant
   * @param startDate - Start date for filtering (optional, ISO string)
   * @param endDate - End date for filtering (optional, ISO string)
   * @returns Revenue analytics
   */
  async getRevenue(startDate?: string, endDate?: string): Promise<RevenueResult> {
    const url = new URL(`${this.baseUrl}/api/plugin/revenue`);
    if (startDate) url.searchParams.set('startDate', startDate);
    if (endDate) url.searchParams.set('endDate', endDate);

    const response = await fetch(url.toString(), {
      headers: {
        'X-API-Key': this.apiKey
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get revenue');
    }

    return response.json();
  }
}