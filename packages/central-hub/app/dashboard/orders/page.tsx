import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'Orders',
  description: 'View and manage orders',
};

export default async function Orders() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      tenant: {
        select: {
          name: true,
          slug: true
        }
      },
      customer: {
        select: {
          email: true,
          name: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link href="/dashboard/orders/new" className="btn btn-primary">
          Create Order
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>View and manage all orders</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Order ID</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-20">Amount</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-16">Date</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono">{order.id}</TableCell>
                    <TableCell>{order.tenant?.name}</TableCell>
                    <TableCell>
                      {order.customer?.name || ''} <br />
                      <span className="text-sm text-muted-foreground">{order.customer?.email}</span>
                    </TableCell>
                    <TableCell>${(order.amount / 100).toFixed(2)} {order.currency.toUpperCase()}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new order.createdAt.toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Link href={`/dashboard/orders/${order.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                      {order.status === 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {}}
                        >
                          Refund
                        </Button>
                      )}
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

function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'paid':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'default';
  }
}