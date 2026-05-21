import { withTenantAuthentication } from '@/lib/auth';
import { NextResponse } from 'next/server';

export const POST = withTenantAuthentication(
  async (request: Request, tenant: any) => {
    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
      },
    });
  }
);