import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'Subscriptions',
  description: 'Manage your subscriptions',
};

export default async function Subscriptions() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: 'desc' },
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
        <h1 className="text-2xl font-bold">Subscriptions</h1>
        <Link href="/dashboard/subscriptions/new" className="btn btn-primary">
          Create Subscription
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>View and manage all subscriptions</CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-muted-foreground">No subscriptions found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Subscription ID</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-16">Current Period End</TableHead>
                  <TableHead className="w-16">Cancel at Period End</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-mono">{sub.id}</TableCell>
                    <TableCell>{sub.tenant?.name}</TableCell>
                    <TableCell>
                      {sub.customer?.name || ''} <br />
                      <span className="text-sm text-muted-foreground">{sub.customer?.email}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(sub.status)}>
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {sub.cancelAtPeriodEnd ? (
                        <Badge variant="secondary">Yes</Badge>
                      ) : (
                        <Badge variant="default">No</Badge>
                      )}
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Link href={`/dashboard/subscriptions/${sub.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {}}
                      >
                        Cancel
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

function getStatusVariant(status: string): 'default' | 'destructive' | 'secondary' {
  switch (status) {
    case 'active':
      return 'default';
    case 'past_due':
      return 'destructive';
    case 'canceled':
      return 'destructive';
    case 'unpaid':
      return 'destructive';
    case 'trialing':
      return 'secondary';
    default:
      return 'default';
  }
}