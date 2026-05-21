import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata = {
  title: 'Products',
  description: 'Manage your products and prices',
};

export default async function Products() {
  const products = await prisma.product.findMany({
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
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/dashboard/products/new" className="btn btn-primary">
          Add New Product
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
          <CardDescription>Manage the products and prices for your connected websites</CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground">No products found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Website</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="w-24">Price ID</TableHead>
                  <TableHead className="w-16">Amount</TableHead>
                  <TableHead className="w-16">Currency</TableHead>
                  <TableHead className="w-16">Type</TableHead>
                  <TableHead className="w-16">Status</TableHead>
                  <TableHead className="w-16">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.tenant?.name}</TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="font-mono">{product.stripePriceId}</TableCell>
                    <TableCell>${(product.amount / 100).toFixed(2)}</TableCell>
                    <TableCell>{product.currency.toUpperCase()}</TableCell>
                    <TableCell>
                      <Badge variant={product.billingType === 'subscription' ? 'secondary' : 'default'}>
                        {product.billingType === 'subscription' ? 'Subscription' : 'One-time'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.active ? 'default' : 'secondary'}>
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex space-x-2">
                      <Link href={`/dashboard/products/${product.id}`} className="btn btn-sm btn-outline">
                        View
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleProductStatus(product.id, product.active)}
                      >
                        {product.active ? 'Deactivate' : 'Activate'}
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

async function toggleProductStatus(id: string, currentStatus: boolean) {
  alert(`Product status toggle not implemented in demo. Would set ${id} to ${!currentStatus}`);
}