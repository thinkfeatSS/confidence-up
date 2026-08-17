'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Zap,
  Trophy,
  Flame,
  Ban,
  CheckCircle,
} from 'lucide-react';

interface UserDetail {
  id: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  streak: number;
  createdAt: string;
  isBlocked: boolean;
  badgesEarned: number;
  devices?: { id: string; platform: string; lastSeen: string }[];
  activity?: { id: string; action: string; createdAt: string }[];
  badges?: { id: string; name: string; tier: string }[];
}

export default function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data: user, isLoading } = useQuery<UserDetail>({
    queryKey: ['user', id],
    queryFn: async () => {
      const res = await api.get<UserDetail>(`/users/admin/${id}`);
      return res.data;
    },
  });

  const blockMutation = useMutation({
    mutationFn: async (block: boolean) => {
      await api.patch(`/users/admin/${id}/${block ? 'block' : 'unblock'}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user', id] });
      toast.success('User updated');
    },
    onError: () => toast.error('Failed to update user'),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        <div className="h-40 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-64 bg-white/10 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        User not found.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/users">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <h2 className="text-2xl font-bold text-foreground">User Detail</h2>
      </div>

      {/* Profile Card */}
      <Card className="bg-[#1a1a2e] border-white/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-2xl font-bold">
                {user.name[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-foreground">
                    {user.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.isBlocked ? (
                    <Badge variant="destructive">Blocked</Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    >
                      Active
                    </Badge>
                  )}
                  <Button
                    size="sm"
                    variant={user.isBlocked ? 'secondary' : 'destructive'}
                    onClick={() => blockMutation.mutate(!user.isBlocked)}
                    disabled={blockMutation.isPending}
                    className="gap-1.5"
                  >
                    {user.isBlocked ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> Unblock
                      </>
                    ) : (
                      <>
                        <Ban className="w-3.5 h-3.5" /> Block
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Level', value: user.level, icon: Zap, color: 'text-violet-400' },
              { label: 'XP', value: user.xp?.toLocaleString(), icon: Trophy, color: 'text-cyan-400' },
              { label: 'Streak', value: `${user.streak}d`, icon: Flame, color: 'text-orange-400' },
              { label: 'Badges', value: user.badgesEarned ?? 0, icon: Trophy, color: 'text-yellow-400' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/5 rounded-xl p-3 text-center"
              >
                <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-1`} />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Badges */}
      {user.badges && user.badges.length > 0 && (
        <Card className="bg-[#1a1a2e] border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Earned Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user.badges.map((b) => (
                <Badge
                  key={b.id}
                  variant="secondary"
                  className="bg-violet-600/20 text-violet-300 border-violet-500/30"
                >
                  {b.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Devices */}
      {user.devices && user.devices.length > 0 && (
        <Card className="bg-[#1a1a2e] border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {user.devices.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                >
                  <span className="text-sm text-foreground capitalize">
                    {d.platform}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Last seen {new Date(d.lastSeen).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Activity */}
      {user.activity && user.activity.length > 0 && (
        <Card className="bg-[#1a1a2e] border-white/10">
          <CardHeader>
            <CardTitle className="text-base">Activity Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user.activity.map((a) => (
                <div key={a.id} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-foreground">{a.action}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
