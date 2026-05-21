import '../globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'Stripe Gateway Hub',
  description: 'Multi-tenant payment platform dashboard',
};

export default function DashboardLayout(
  children: React.ReactNode
) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
    </div>
  );
}