import type { Metadata } from 'next';
import { UserShell } from '@/components/user/UserShell';
import { UserDashboard } from '@/components/user/UserDashboard';

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'View your Speak Up Mic progress, stats, and performance.',
};

export default function MyDashboardPage() {
  return (
    <UserShell>
      <UserDashboard />
    </UserShell>
  );
}
