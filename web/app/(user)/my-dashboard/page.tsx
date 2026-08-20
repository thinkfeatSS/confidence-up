import type { Metadata } from 'next';
import { UserShell } from '@/components/user/UserShell';
import { UserDashboard } from '@/components/user/UserDashboard';

export const metadata: Metadata = {
  title: 'My Dashboard',
  description: 'View your SpeakUpMic progress, stats, and performance.',
};

export default function MyDashboardPage() {
  return (
    <UserShell>
      <UserDashboard />
    </UserShell>
  );
}
