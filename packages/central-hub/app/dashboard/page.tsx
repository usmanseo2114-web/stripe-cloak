import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Stripe Gateway Hub - Dashboard',
  description: 'Overview of payment activity across all tenants',
};

export default async function Dashboard() {
  // Fetch summary statistics
  const [tenantCount, orderCount, revenueData, recentOrders] = await Promise.all([
    prisma.tenant.count({ where: { active: true } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' }
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        tenant: { select: { name: true } },
        customer: { select: { email: true } }
      }
    })
  ]);

  const totalRevenue = revenueData._sum.amount || 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex space-x-3">
          <Button variant="outline" size="icon">
            {/* Refresh icon placeholder */}
            Refresh
          </Button>
          <Button>Export Data</Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Websites</CardTitle>
            <CardDescription>Currently connected tenants</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{tenantCount}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Orders</CardTitle>
            <CardDescription>All time order count</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{orderCount}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue</CardTitle>
            <CardDescription>From completed payments</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Recurring Revenue</CardTitle>
            <CardDescription>From active subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">$0.00</CardContent> {/* Placeholder */}
        </Card>
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
          <h2 className="text-xl font-semibold">Recent Orders</h2>
          <Button asChild>
            <a href="/dashboard/orders">View All</a>
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Order ID</TableHead>
              <TableHead>Website</TableHead>
              <TableHead className="w-24">Customer</TableHead>
              <TableHead className="w-16">Amount</TableHead>
              <TableHead className="w-16">Status</TableHead>
              <TableHead className="w-12">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-mono">{order.id}</TableCell>
                <TableCell>{order.tenant?.name || 'Unknown'}</TableCell>
                <TableCell>{order.customer?.email || 'Guest'}</TableCell>
                <TableCell>${(order.amount / 100).toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(order.status)}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper function to get badge variant based on order status
function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'paid':
      return 'default';
    case 'failed':
      return 'destructive';
    case 'refunded':
      return 'secondary';
    default:
      return 'default';
  }
}