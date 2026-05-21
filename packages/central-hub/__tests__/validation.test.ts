import {
  createCheckoutRequestSchema,
  createSubscriptionRequestSchema,
  cancelSubscriptionRequestSchema,
  refundRequestSchema,
  orderStatusRequestSchema,
  ordersRequestSchema,
  revenueRequestSchema
} from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('createCheckoutRequestSchema', () => {
    it('should validate a correct checkout request', () => {
      const validData = {
        priceId: 'price_123',
        customerEmail: 'test@example.com',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        metadata: { key: 'value' }
      };

      const result = createCheckoutRequestSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidData = {
        priceId: 'price_123',
        customerEmail: 'invalid-email',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      };

      const result = createCheckoutRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should require all required fields', () => {
      const invalidData = {
        priceId: 'price_123',
        // missing customerEmail
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      };

      const result = createCheckoutRequestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('ordersRequestSchema', () => {
    it('should use default values for limit and offset', () => {
      const result = ordersRequestSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should accept custom limit and offset', () => {
      const data = { limit: 5, offset: 20 };
      const result = ordersRequestSchema.safeParse(data);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
        expect(result.data.offset).toBe(20);
      }
    });
  });
});