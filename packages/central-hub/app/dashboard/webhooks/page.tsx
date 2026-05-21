import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'Webhook Logs',
  description: 'View Stripe webhook events',
};

export default async function WebhookLogs() {
  const webhookEvents = await prisma.webhookEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      stripeEventId: true,
      type: true,
      processed: true,
      createdAt: true
    }
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
        <h1 className="text-2xl font-bold">Webhook Logs</h1>
        <div className="flex space-x-3">
          <Button variant="outline" size="icon">
            {/* Refresh icon placeholder */}
            Refresh
          </Button>
          <Button>Export Logs</Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Events</CardTitle>
          <CardDescription>View all Stripe webhook events received by the hub</CardDescription>
        </CardHeader>
        <CardContent>
          {webhookEvents.length === 0 ? (
            <p className="text-muted-foreground">No webhook events found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Event ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-16">Processed</TableHead>
                  <TableHead className="w-16">Date</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono">{event.stripeEventId}</TableCell>
                    <TableCell>{event.type}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={event.processed ? 'default' : 'secondary'}>
                        {event.processed ? 'Yes' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Link href={`/dashboard/webhooks/${event.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
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