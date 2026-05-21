import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'Customers',
  description: 'Manage your customers',
};

export default async function Customers() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: {
        select: {
          name: true,
          slug: true
        }
      },
      _count: {
        select: { orders: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <Link href="/dashboard/customers/new" className="btn btn-primary">
          Add New Customer
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>Manage the customers for your connected websites</CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-muted-foreground">No customers found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-32">Email</TableHead>
                  <TableHead className="w-20">Orders</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>{customer.tenant?.name}</TableCell>
                    <TableCell>{customer.name || '—'}</TableCell>
                    <TableCell className="font-mono">{customer.email}</TableCell>
                    <TableCell className="text-center">{customer._count.orders}</TableCell>
                    <TableCell className="text-center">
                      {/* Customer status could be based on recent activity, but we'll just show active for now */}
                      <Badge variant="default">Active</Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Link href={`/dashboard/customers/${customer.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {}}
                      >
                        Edit
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