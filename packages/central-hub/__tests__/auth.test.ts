import { NextResponse } from 'next/server';
import { authenticateTenant, withTenantAuthentication } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

// Mock prisma
jest.mock('@/lib/prisma', () => {
  return {
    prisma: {
      apiKey: {
        findMany: jest.fn()
      },
      tenant: {
        findUnique: jest.fn()
      }
    }
  };
});

// Mock bcrypt
jest.mock('bcryptjs', () => {
  return {
    compare: jest.fn()
  };
});

describe('authenticateTenant', () => {
  const mockedPrisma = require('@/lib/prisma').prisma;
  const mockedCompare = require('bcryptjs').compare;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if X-API-Key header is missing', async () => {
    const request = {
      headers: {
        get: jest.fn().mockReturnValue(null)
      }
    } as unknown as Request;

    const response = await authenticateTenant(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Missing X-API-Key header' });
  });

  it('should return 401 if no active API key matches', async () => {
    const request = {
      headers: {
        get: jest.fn().mockReturnValue('provided_key')
      }
    } as unknown as Request;

    // Mock the API key records returned from the database
    mockedPrisma.apiKey.findMany.mockResolvedValue([
      { id: 'key_1', keyHash: 'hashed_key_1', tenantId: 'tenant_1' },
      { id: 'key_2', keyHash: 'hashed_key_2', tenantId: 'tenant_2' }
    ]);

    // Mock the compare function to return false for all keys
    mockedCompare.mockResolvedValue(false);

    const response = await authenticateTenant(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid API key' });
  });

  it('should return tenant and apiKeyRecord if a valid API key is provided', async () => {
    const request = {
      headers: {
        get: jest.fn().mockReturnValue('provided_key')
      }
    } as unknown as Request;

    // Mock the API key records returned from the database
    const apiKeyRecord = {
      id: 'key_1',
      keyHash: 'hashed_key_1',
      tenantId: 'tenant_1'
    };
    mockedPrisma.apiKey.findMany.mockResolvedValue([apiKeyRecord]);

    // Mock the compare function to return true for the first key
    mockedCompare.mockResolvedValue(true);

    // Mock the tenant lookup
    mockedPrisma.tenant.findUnique.mockResolvedValue({
      id: 'tenant_1',
      name: 'Tenant 1',
      slug: 'tenant-1',
      domain: 'tenant-1.example.com',
      active: true,
      branding: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const result = await authenticateTenant(request);
    expect(result).not.toBeInstanceOf(NextResponse);
    // The result should be an object with tenant and apiKeyRecord
    expect(result).toHaveProperty('tenant');
    expect(result).toHaveProperty('apiKeyRecord');
    // Check that the tenant is the one we mocked
    expect(result.tenant.id).toBe('tenant_1');
    // Check that the apiKeyRecord is the one we mocked
    expect(result.apiKeyRecord.id).toBe('key_1');
    // Check that the lastUsedAt was updated (we are not testing the update call here for simplicity)
  });

  it('should return 401 if the tenant is not found or inactive', async () => {
    const request = {
      headers: {
        get: jest.fn().mockReturnValue('provided_key')
      }
    } as unknown as Request;

    // Mock the API key records returned from the database
    const apiKeyRecord = {
      id: 'key_1',
      keyHash: 'hashed_key_1',
      tenantId: 'tenant_1'
    };
    mockedPrisma.apiKey.findMany.mockResolvedValue([apiKeyRecord]);

    // Mock the compare function to return true for the first key
    mockedCompare.mockResolvedValue(true);

    // Mock the tenant lookup to return null (not found)
    mockedPrisma.tenant.findUnique.mockResolvedValue(null);

    const response = await authenticateTenant(request);
    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Tenant not found or inactive' });
  });
});

describe('withTenantAuthentication', () => {
  it('should call the handler with the tenant if authentication succeeds', async () => {
    // Mock the authenticateTenant to return a tenant
    const mockTenant = { id: 'tenant_1', name: 'Tenant 1' };
    jest.spyOn(require('@/lib/auth'), 'authenticateTenant').mockResolvedValue({ tenant: mockTenant });

    // Create a mock handler
    const handler = jest.fn().mockResolvedValue(new NextResponse(JSON.stringify({ success: true }), { status: 200 }));

    // Wrap the handler
    const wrappedHandler = withTenantAuthentication(handler);

    // Create a mock request
    const request = {} as Request;

    // Call the wrapped handler
    const response = await wrappedHandler(request);

    // Expect the handler to have been called with the request and the tenant
    expect(handler).toHaveBeenCalledWith(request, mockTenant);
    expect(response.status).toBe(200);
  });

  it('should return the error response if authentication fails', async () => {
    // Mock the authenticateTenant to return an error response
    const errorResponse = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    jest.spyOn(require('@/lib/auth'), 'authenticateTenant').mockResolvedValue(errorResponse);

    // Create a mock handler
    const handler = jest.fn();

    // Wrap the handler
    const wrappedHandler = withTenantAuthentication(handler);

    // Create a mock request
    const request = {} as Request;

    // Call the wrapped handler
    const response = await wrappedHandler(request);

    // Expect the handler not to have been called
    expect(handler).not.toHaveBeenCalled();
    // Expect the error response to be returned
    expect(response).toBe(errorResponse);
  });

  it('should return 500 if the handler throws an error', async () => {
    // Mock the authenticateTenant to return a tenant
    const mockTenant = { id: 'tenant_1', name: 'Tenant 1' };
    jest.spyOn(require('@/lib/auth'), 'authenticateTenant').mockResolvedValue({ tenant: mockTenant });

    // Create a mock handler that throws an error
    const handler = jest.fn().mockImplementation(() => {
      throw new Error('Test error');
    });

    // Wrap the handler
    const wrappedHandler = withTenantAuthentication(handler);

    // Create a mock request
    const request = {} as Request;

    // Call the wrapped handler
    const response = await wrappedHandler(request);

    // Expect the handler to have been called
    expect(handler).toHaveBeenCalledWith(request, mockTenant);
    // Expect a 500 response
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Internal server error' });
  });
});