import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

/**
 * Middleware to validate API key and attach tenant to request.
 * Usage: export const middleware = authenticateTenant;
 * Then in route handler: const tenant = request.tentant;
 */
export async function authenticateTenant(
  request: Request,
  tenantIdHeader: string = 'X-Tenant-Id' // Not used, we use API key
) {
  const apiKey = request.headers.get('X-API-Key');
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Missing X-API-Key header' },
      { status: 401 }
    );
  }

  // Find active API key by hash
  // We cannot directly compare the plain key with hash in the DB without fetching all keys.
  // Instead, we fetch all active API keys and compare the hash.
  // This is not efficient for large number of tenants, but acceptable for 10-1000 tenants.
  // For larger scale, we would use a different strategy (e.g., hash the key and look up by keyHash).
  const apiKeyRecords = await prisma.apiKey.findMany({
    where: { active: true },
    select: { id: true, keyHash: true, tenantId: true }
  });

  let validApiKey = null;
  for (const record of apiKeyRecords) {
    const isValid = await bcrypt.compare(apiKey, record.keyHash);
    if (isValid) {
      validApiKey = record;
      break;
    }
  }

  if (!validApiKey) {
    return NextResponse.json(
      { error: 'Invalid API key' },
      { status: 401 }
    );
  }

  // Fetch tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: validApiKey.tenantId }
  });

  if (!tenant || !tenant.active) {
    return NextResponse.json(
      { error: 'Tenant not found or inactive' },
      { status: 401 }
    );
  }

  // Update lastUsedAt
  await prisma.apiKey.update({
    where: { id: validApiKey.id },
    data: { lastUsedAt: new Date() }
  });

  // Return tenant and apiKeyRecord for use in route handler
  return { tenant, apiKeyRecord: validApiKey };
}

/**
 * Wrapper for route handlers to handle authentication and errors.
 */
export function withTenantAuthentication(handler: (request: Request, tenant: any) => Promise<Response> | Response) {
  return async (request: Request) => {
    const authResult = await authenticateTenant(request);
    if (authResult instanceof NextResponse) {
      return authResult; // error response
    }
    const { tenant } = authResult;
    try {
      return await handler(request, tenant);
    } catch (error) {
      console.error('Error in authenticated route:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}