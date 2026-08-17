'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { useUser } from '@/hooks/useUser';
import { useProgress, useConfidenceHistory } from '@/hooks/useProgress';
import { useBadges } from '@/hooks/useBadges';
import { useReferralCode } from '@/hooks/useGamification';
import { api } from '@/lib/api';
import { mapUserFromApi } from '@/lib/mapUser';
import { XPBar } from '@/components/user/XPBar';
import { ConfidenceRing } from '@/components/user/ConfidenceRing';
import { StatCard } from '@/components/user/StatCard';
import { ProgressChart } from '@/components/user/ProgressChart';
import { GrowthIntelligence } from '@/components/user/GrowthIntelligence';
import { DailyChallengeCard } from '@/components/user/DailyChallengeCard';
import { SpeechSessionList } from '@/components/user/SpeechSessionList';
import { useDailyHub } from '@/hooks/useDailyHub';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Tab = 'overview' | 'progress' | 'profile';

export function UserDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const setUser = useAuthStore((s) => s.setUser);

  const { data: user, isLoading: userLoading } = useUser();
  const { data: progress, isLoading: progressLoading } = useProgress();
  const { data: history } = useConfidenceHistory(period);
  const { data: badges } = useBadges();
  const { data: referralCode } = useReferralCode();
  const { data: dailyHub, isLoading: dailyLoading } = useDailyHub();

  useEffect(() => {
    if (!useAuthStore.getState().user) {
      api.get('/users/me').then((res) => {
        const mapped = mapUserFromApi(res.data as Record<string, unknown>);
        setUser({
          id: mapped.id,
          name: mapped.name,
          email: mapped.email,
          role: mapped.role,
        });
      }).catch(() => {});
    }
  }, [setUser]);

  const earnedBadges = useMemo(
    () => (badges ?? []).filter((b) => b.earned).slice(0, 8),
    [badges],
  );

  if (userLoading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <XPBar
        level={user.level}
        levelTitle={user.levelTitle}
        xp={user.xp}
        xpToNextLevel={user.xpToNextLevel}
        streak={user.streak}
      />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Hey, {user.name} 👋</h1>
          <p className="text-muted-foreground">Your confidence journey at a glance</p>
        </div>

        <div className="mb-6 flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {(['overview', 'progress', 'profile'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-md px-3 py-2 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <DailyChallengeCard hub={dailyHub} isLoading={dailyLoading} />

            <Card>
              <CardContent className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start">
                <ConfidenceRing score={user.confidenceScore} />
                <div className="grid flex-1 gap-4 sm:grid-cols-3">
                  <StatCard icon="⚡" value={user.totalXP.toLocaleString()} label="Total XP" />
                  <StatCard icon="🎤" value={user.totalSpeeches} label="Speeches" />
                  <StatCard icon="✅" value={user.totalChallenges} label="Challenges" />
                </div>
              </CardContent>
            </Card>

            {earnedBadges.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {earnedBadges.map((badge) => (
                      <div
                        key={badge.id}
                        className="flex flex-col items-center rounded-xl border border-border bg-muted/30 px-4 py-3 text-center transition-transform hover:scale-105"
                      >
                        <span className="text-2xl">{badge.icon}</span>
                        <span className="mt-1 max-w-[100px] text-xs font-medium">{badge.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-start gap-3 p-6 sm:flex-row sm:items-center">
                <span className="text-3xl">📱</span>
                <div>
                  <p className="font-semibold text-foreground">Keep building in the app</p>
                  <p className="text-sm text-muted-foreground">
                    Record new sessions on mobile — your web dashboard shows growth trends,
                    confidence dimensions, and Atlas coaching from each practice.
                  </p>
                </div>
              </CardContent>
            </Card>

            {progress?.speechSessions && progress.speechSessions.length > 0 && (
              <SpeechSessionList sessions={progress.speechSessions.slice(0, 3)} />
            )}
          </div>
        )}

        {tab === 'progress' && (
          <div className="space-y-6">
            {progress?.growthMetrics && (
              <div>
                <h2 className="mb-3 text-lg font-semibold text-foreground">Growth intelligence</h2>
                <GrowthIntelligence metrics={progress.growthMetrics} />
              </div>
            )}

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Confidence history</CardTitle>
                <div className="flex gap-1 rounded-lg border border-border p-0.5">
                  {(['week', 'month'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPeriod(p)}
                      className={cn(
                        'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                        period === p
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {p === 'week' ? '7D' : '30D'}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                <ProgressChart data={history ?? []} />
              </CardContent>
            </Card>

            {progressLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : progress ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard icon="⚡" value={progress.totalXP.toLocaleString()} label="Total XP" />
                <StatCard icon="📅" value={progress.weeklyXP} label="Weekly XP" />
                <StatCard icon="🔥" value={progress.bestStreak} label="Best streak" />
                <StatCard icon="🎤" value={progress.totalSpeeches} label="Speeches" />
                <StatCard icon="✅" value={progress.totalChallenges} label="Challenges" />
                <StatCard icon="🎯" value={`${progress.averageScore}%`} label="Avg score" />
              </div>
            ) : null}

            {progress?.speechSessions && (
              <SpeechSessionList sessions={progress.speechSessions} />
            )}
          </div>
        )}

        {tab === 'profile' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-lg font-semibold">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="mt-1 text-sm text-primary">
                      Level {user.level} · {user.levelTitle}
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard icon="⚡" value={user.totalXP.toLocaleString()} label="Total XP" />
                  <StatCard icon="📊" value={`${user.confidenceScore}%`} label="Confidence" />
                </div>
              </CardContent>
            </Card>

            {user.confidenceAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Confidence areas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.confidenceAreas.map((area) => (
                    <div key={area.area}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{area.area}</span>
                        <span className="font-medium">{area.score}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${area.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {progress?.speechSessions?.[0]?.components && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Latest session dimensions</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    From your most recent practice: {progress.speechSessions[0].prompt}
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Fluency', progress.speechSessions[0].components.speechFluencyScore],
                    ['Vocabulary', progress.speechSessions[0].components.vocabularyScore],
                    ['Structure', progress.speechSessions[0].components.structureScore],
                    ['Topic', progress.speechSessions[0].components.topicRelevanceScore],
                    ['Energy', progress.speechSessions[0].components.energyScore],
                    ['Consistency', progress.speechSessions[0].components.practiceConsistencyScore],
                  ].map(([label, score]) => (
                    <div key={label as string}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span>{label}</span>
                        <span className="font-medium">{score}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {referralCode && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Referral code</CardTitle>
                </CardHeader>
                <CardContent>
                  <code className="rounded-lg border border-border bg-muted px-4 py-2 text-lg font-mono">
                    {referralCode}
                  </code>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Share this code with friends to earn rewards.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </>
  );
}
