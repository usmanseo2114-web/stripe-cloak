import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'Connected Websites',
  description: 'Manage your connected websites (tenants)',
};

export default async function Websites() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      domain: true,
      active: true,
      createdAt: true,
      _count: {
        select: { orders: true, customers: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
        <h1 className="text-2xl font-bold">Connected Websites</h1>
        <Link href="/dashboard/websites/new" className="btn btn-primary">
          Add New Website
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Websites</CardTitle>
          <CardDescription>Manage the websites connected to your payment hub</CardDescription>
        </CardHeader>
        <CardContent>
          {tenants.length === 0 ? (
            <p className="text-muted-foreground">No websites connected yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-32">Slug</TableHead>
                  <TableHead className="w-32">Domain</TableHead>
                  <TableHead className="w-20">Orders</TableHead>
                  <TableHead className="w-20">Customers</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>{tenant.name}</TableCell>
                    <TableCell className="font-mono">{tenant.slug}</TableCell>
                    <TableCell className="font-mono">{tenant.domain}</TableCell>
                    <TableCell className="text-center">{tenant._count.orders}</TableCell>
                    <TableCell className="text-center">{tenant._count.customers}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={tenant.active ? 'default' : 'secondary'}>
                        {tenant.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Link href={`/dashboard/websites/${tenant.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleTenantStatus(tenant.id, tenant.active)}
                      >
                        {tenant.active ? 'Deactivate' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

async function toggleTenantStatus(id: string, currentStatus: boolean) {
  // In a real app, this would be an API call
  // For now, we'll just show an alert
  alert(`Tenant status toggle not implemented in demo. Would set ${id} to ${!currentStatus}`);
}