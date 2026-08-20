'use client';

import { Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DailyHub } from '@/hooks/useDailyHub';

type DailyChallengeCardProps = {
  hub?: DailyHub | null;
  isLoading?: boolean;
};

function difficultyColor(difficulty: string) {
  if (difficulty === 'EASY' || difficulty === 'easy') return 'text-emerald-500';
  if (difficulty === 'HARD' || difficulty === 'hard') return 'text-red-400';
  return 'text-amber-500';
}

export function DailyChallengeCard({ hub, isLoading }: DailyChallengeCardProps) {
  if (isLoading) {
    return (
      <Card className="border-primary/20">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!hub?.mission) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Today&apos;s mission will appear here once assigned. Open the mobile app to complete it.
        </CardContent>
      </Card>
    );
  }

  const { mission, challenge, missionCompleted, streak, tip } = hub;
  const dateLabel = new Date(hub.date + 'T12:00:00').toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card className="overflow-hidden border-primary/25 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-primary">Daily challenge</p>
            <CardTitle className="mt-1 text-lg">{dateLabel}</CardTitle>
          </div>
          <div className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-sm font-semibold text-orange-500">
            🔥 {streak} day streak
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-foreground">{tip}</p>
        </div>

        <div
          className={cn(
            'rounded-xl border p-4',
            missionCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border bg-card/60',
          )}
        >
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-muted px-2 py-0.5 capitalize">{mission.category}</span>
            <span className={cn('font-medium capitalize', difficultyColor(mission.difficulty))}>
              {mission.difficulty.toLowerCase()}
            </span>
            <span className="font-semibold text-amber-500">+{mission.xpReward} XP</span>
            {missionCompleted && (
              <span className="font-semibold text-emerald-500">✓ Completed</span>
            )}
          </div>
          <h3 className="text-base font-semibold text-foreground">{mission.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{mission.description}</p>
          <p className="mt-2 text-sm italic text-primary/90">🎯 {mission.prompt}</p>
          {!missionCompleted && (
            <p className="mt-3 text-xs text-muted-foreground">
              Complete this in the SpeakUpMic app — tap Practice on the Daily Challenge tab.
            </p>
          )}
        </div>

        {challenge && (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Bonus real-world challenge
            </p>
            <h4 className="mt-1 font-medium text-foreground">{challenge.title}</h4>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
            <p className="mt-2 text-xs font-medium text-amber-500">+{challenge.xpReward} XP</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
