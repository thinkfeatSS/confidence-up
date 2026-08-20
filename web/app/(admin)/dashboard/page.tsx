'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import {
  Users,
  Activity,
  TrendingUp,
  Target,
  Mic,
  Star,
} from 'lucide-react';

interface DashboardApiData {
  totalUsers: number;
  activeToday: number;
  newUsersThisWeek: number;
  totalMissionsCompleted: number;
  totalSpeechSessions: number;
  avgConfidenceScore: number;
  userGrowth: { date: string; count: number }[];
  topBadges: { badge: { name: string; icon?: string } | null; count: number }[];
}

function StatCard({
  title,
  value,
  icon: Icon,
  accent,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{value ?? '—'}</p>
          </div>
          <div className={`w-10 h-10 rounded-xl ${accent} flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="shadow-sm">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            <div className="h-7 w-16 bg-muted rounded animate-pulse" />
          </div>
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardApiData>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get<DashboardApiData>('/analytics/admin/dashboard');
      return res.data;
    },
  });

  const userGrowth = data?.userGrowth ?? [];
  const topBadges = (data?.topBadges ?? []).map((b) => ({
    name: b.badge?.name ?? 'Unknown',
    earnCount: b.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back. Here&apos;s what&apos;s happening with SpeakUpMic.
        </p>
        {isError && (
          <p className="text-sm text-destructive mt-2">Failed to load dashboard stats.</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Users" value={data?.totalUsers?.toLocaleString() ?? 0} icon={Users} accent="bg-violet-600" />
            <StatCard title="Active Today" value={data?.activeToday?.toLocaleString() ?? 0} icon={Activity} accent="bg-cyan-600" />
            <StatCard title="New This Week" value={data?.newUsersThisWeek?.toLocaleString() ?? 0} icon={TrendingUp} accent="bg-emerald-600" />
            <StatCard title="Missions Completed" value={data?.totalMissionsCompleted?.toLocaleString() ?? 0} icon={Target} accent="bg-orange-500" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard title="Total Speech Sessions" value={data?.totalSpeechSessions?.toLocaleString() ?? 0} icon={Mic} accent="bg-pink-600" />
            <StatCard
              title="Avg Confidence Score"
              value={data?.avgConfidenceScore != null ? `${data.avgConfidenceScore.toFixed(1)}%` : '—'}
              icon={Star}
              accent="bg-amber-500"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">User Growth (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-56 bg-muted rounded-lg animate-pulse" />
            ) : userGrowth.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No growth data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                  <Line type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top Badges by Earn Count</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-56 bg-muted rounded-lg animate-pulse" />
            ) : topBadges.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">No badge data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topBadges} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: 12 }} />
                  <Bar dataKey="earnCount" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
