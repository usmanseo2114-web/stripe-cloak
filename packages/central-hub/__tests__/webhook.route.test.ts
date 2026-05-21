import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Mock the Stripe library
jest.mock('stripe');

// Mock the StripeService
jest.mock('@/lib/stripe');

import { POST as webhookPost } from '@/app/api/stripe/webhook/route';

describe('POST /api/stripe/webhook', () => {
  const mockRequest = {
    text: jest.fn(),
    headers: {
      get: jest.fn()
    }
  } as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 if the signature is invalid', async () => {
    // Mock the request
    mockRequest.text.mockResolvedValue('{"id":"evt_123"}');
    mockRequest.headers.get.mockReturnValue('invalid_signature');

    // Mock Stripe webhook constructEvent to throw an error
    const stripeMock = {
      webhooks: {
        constructEvent: jest.fn().mockImplementation(() => {
          throw new Error('Invalid signature');
        })
      }
    };
    (Stripe as jest.Mock).mockReturnValue(stripeMock);

    const response = await webhookPost(mockRequest);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain('Webhook Error');
  });

  it('should return 200 if the event is processed successfully', async () => {
    // Mock the request
    const mockBody = JSON.stringify({
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          metadata: {
            tenantId: 'tenant_123'
          }
        }
      }
    });
    mockRequest.text.mockResolvedValue(mockBody);
    mockRequest.headers.get.mockReturnValue('valid_signature');

    // Mock Stripe
    const stripeMock = {
      webhooks: {
        constructEvent: jest.fn().mockImplementation((payload, sig, secret) => {
          // If the secret is correct, return the parsed event
          if (secret === 'whsec_test_secret') {
            return JSON.parse(payload);
          }
          throw new Error('Invalid signature');
        })
      }
    };
    (Stripe as jest.Mock).mockReturnValue(stripeMock);

    // Mock StripeService
    const mockedStripeService = {
      handleWebhookEvent: jest.fn().mockResolvedValue({})
    };
    const StripeServiceMock = require('@/lib/stripe').StripeService;
    StripeServiceMock.mockImplementation(() => mockedStripeService);

    // Set the environment variable for the webhook secret
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    const response = await webhookPost(mockRequest);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.received).toBe(true);

    // Verify that the StripeService was called with the event
    expect(mockedStripeService.handleWebhookEvent).toHaveBeenCalledWith({
      id: 'evt_123',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_123',
          metadata: {
            tenantId: 'tenant_123'
          }
        }
      }
    });
  });
});