import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="flex h-16 items-center px-4 border-b border-gray-200">
        <span className="text-xl font-semibold">Stripe Gateway Hub</span>
      </div>
      <nav className="mt-6 space-y-1">
        <Link href="/" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Dashboard
        </Link>
        <Link href="/dashboard/websites" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Websites
        </Link>
        <Link href="/dashboard/products" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Products
        </Link>
        <Link href="/dashboard/customers" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Customers
        </Link>
        <Link href="/dashboard/orders" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Orders
        </Link>
        <Link href="/dashboard/subscriptions" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Subscriptions
        </Link>
        <Link href="/dashboard/analytics" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Analytics
        </Link>
        <Link href="/dashboard/webhooks" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Webhook Logs
        </Link>
        <Link href="/dashboard/api-keys" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          API Keys
        </Link>
        <Link href="/dashboard/settings" className="flex w-full items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
          Settings
        </Link>
      </nav>
    </aside>
  );
}