import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { AdminShell } from '@/components/layout/AdminShell';

export const metadata: Metadata = {
  title: 'ConfidenceUp Admin',
  description: 'Admin panel for ConfidenceUp',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />
      <Header />
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
