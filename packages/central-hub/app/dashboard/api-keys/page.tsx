import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'API Keys',
  description: 'Manage API keys for your connected websites',
};

export default async function APIKeys() {
  const apiKeys = await prisma.apiKey.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      tenant: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col space-y-2 md:flex-row md:items-start md:justify-between">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <Link href="/dashboard/api-keys/new" className="btn btn-primary">
          Generate New API Key
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>API Keys</CardTitle>
          <CardDescription>Manage the API keys used by your websites to connect to the hub</CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-muted-foreground">No API keys found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Key ID</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead className="w-20">Last Used</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-mono">{key.id}</TableCell>
                    <TableCell>{key.tenant?.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={key.active ? 'default' : 'secondary'}>
                        {key.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Link href={`/dashboard/api-keys/${key.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {}}
                      >
                        {key.active ? 'Deactivate' : 'Activate'}
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