import { createCheckoutRequestSchema } from '@/lib/validation';
import { StripeService } from '@/lib/stripe';
import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';

// We are going to test the handler function by importing the route file and calling it.
// However, because of the way Next.js route handlers are structured, we can test the handler function directly.
// Let's create a mock for the request and the tenant.

// We'll refactor the route handler to export the handler function so we can test it.
// But to avoid changing the production code, we can test the route by using Next.js's testing utilities.
// Alternatively, we can test the logic by extracting it to a service.

// Since we are short on time, we'll test the StripeService and the validation, which we already did.
// For the route, we can do a simpler test by mocking the middleware and the service.

// Let's create a test that uses the actual route handler by mocking the dependencies.

jest.mock('@/lib/auth');
jest.mock('@/lib/stripe');

import { POST } from './route';

describe('POST /api/plugin/create-checkout', () => {
  const mockRequest = {
    json: jest.fn()
  } as unknown as Request;

  const mockTenant = {
    id: 'tenant_123',
    name: 'Test Tenant',
    slug: 'test-tenant',
    domain: 'test.example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if authentication fails', async () => {
    // Mock the authenticateTenant to return an error response
    (withTenantAuthentication as jest.Mock).mockImplementation(() => {
      return async (_request: Request) => {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      };
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized' });
  });

  it('should return 400 for invalid request body', async () => {
    // Mock the authenticateTenant to return the tenant
    (withTenantAuthentication as jest.Mock).mockImplementation((handler) => {
      return async (request: Request) => {
        return handler(request, mockTenant);
      };
    });

    // Mock request.json to return invalid data
    mockRequest.json.mockResolvedValue({
      // missing required fields
    });

    const response = await POST(mockRequest);
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toBe('Invalid request');
  });

  it('should return 200 with checkout session on success', async () => {
    // Mock the authenticateTenant to return the tenant
    (withTenantAuthentication as jest.Mock).mockImplementation((handler) => {
      return async (request: Request) => {
        return handler(request, mockTenant);
      };
    });

    // Mock request.json to return valid data
    mockRequest.json.mockResolvedValue({
      priceId: 'price_123',
      customerEmail: 'test@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      metadata: { website: 'test-site' }
    });

    // Mock the StripeService
    const mockedStripeService = {
      createCheckoutSession: jest.fn().mockResolvedValue({
        sessionId: 'cs_123',
        checkoutUrl: 'https://checkout.stripe.com/pay/cs_123',
        orderId: 'ord_123'
      })
    };

    // We need to mock the StripeService constructor to return our mocked service
    // Since we already mocked '@/lib/stripe', we can adjust the mock
    const StripeServiceMock = require('@/lib/stripe').StripeService;
    StripeServiceMock.mockImplementation(() => mockedStripeService);

    const response = await POST(mockRequest);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.orderId).toBe('ord_123');
    expect(json.checkoutUrl).toBe('https://checkout.stripe.com/pay/cs_123');

    // Verify that the service was called with the correct parameters
    expect(mockedStripeService.createCheckoutSession).toHaveBeenCalledWith({
      tenantId: mockTenant.id,
      priceId: 'price_123',
      customerEmail: 'test@example.com',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
      metadata: { website: 'test-site' }
    });
  });
});