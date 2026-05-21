import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const metadata = {
  title: 'Analytics',
  description: 'View payment analytics and reports',
};

export default async function Analytics() {
  // Get date range for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Fetch analytics data
  const [tenantStats, orderStats, revenueStats, subscriptionStats] = await Promise.all([
    // Tenant stats
    prisma.tenant.aggregate({
      _count: true,
      _sum: { }
    }),
    // Order stats
    prisma.order.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true },
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    }),
    // Revenue stats (simplified)
    prisma.order.aggregate({
      _sum: { amount: true },
      where: {
        status: 'paid',
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    }),
    // Subscription stats
    prisma.subscription.groupBy({
      by: ['status'],
      _count: true,
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    })
  ]);

  const totalTenants = tenantStats._count || 0;
  const totalRevenue = (revenueStats._sum.amount || 0) / 100; // Convert to dollars

  return (
    <div className="space-y-6">
      <header className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <div className="flex space-x-3">
          <Button variant="outline" size="icon">
            {/* Date picker placeholder */}
            Last 30 Days
          </Button>
          <Button>Export Report</Button>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Websites</CardTitle>
            <CardDescription>Connected tenants</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalTenants}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Revenue (30d)</CardTitle>
            <CardDescription>From completed payments</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">${totalRevenue.toFixed(2)}</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Recurring Revenue</CardTitle>
            <CardDescription>From active subscriptions</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">$0.00</CardContent> {/* Placeholder */}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Failed Payments (30d)</CardTitle>
            <CardDescription>From order status</CardDescription>
          </CardHeader>
          <CardContent className="text-2xl font-bold">0</CardContent> {/* Will calculate from orderStats */}
        </Card>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-4">Order Status Distribution</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* In a real app, we would render a chart here */}
            <div className="space-y-4">
              {orderStats.map((stat) => (
                <div key={stat.status} className="flex justify-between items-center">
                  <span>{stat.status}</span>
                  <span className="font-mono">{stat._count} orders</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">Subscription Status Distribution</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* In a real app, we would render a chart here */}
            <div className="space-y-4">
              {subscriptionStats.map((stat) => (
                <div key={stat.status} className="flex justify-between items-center">
                  <span>{stat.status}</span>
                  <span className="font-mono">{stat._count} subscriptions</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Import Button component (would normally be from '@/components/ui/button')
function Button({ variant = 'default', size = 'default', children, ...props }: React.ButtonHTMLProps<HTMLButtonElement> & { variant?: 'default' | 'destructive' | 'outline' | 'secondary'; size?: 'default' | 'sm' | 'lg' | 'icon'; children: React.ReactNode }) {
  return (
    <button className={`
      inline-flex items-center justify-center rounded-md text-sm font-medium
      transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
      disabled:opacity-50 disabled:pointer-events-none
      ring-offset-background
      h-10 w-10
    `} variant={variant} size={size} {...props}>
      {children}
    </button>
  );
}