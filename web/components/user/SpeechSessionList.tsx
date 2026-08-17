'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { WebSpeechSession } from '@/lib/mapSpeech';

type SpeechSessionListProps = {
  sessions: WebSpeechSession[];
};

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-500';
  if (score >= 60) return 'text-amber-500';
  return 'text-red-500';
}

function DimensionBar({ label, score }: { label: string; score: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{score}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.min(100, score)}%` }}
        />
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: WebSpeechSession }) {
  const [open, setOpen] = useState(false);
  const localNlp = (session.localMetrics?.nlp ?? {}) as Record<string, unknown>;
  const localAudio = (session.localMetrics?.audio ?? {}) as Record<string, unknown>;
  const pauseBreakdown = (localAudio.pauseBreakdown ?? {}) as Record<string, number>;

  return (
    <div className="rounded-xl border border-border bg-card/50">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground line-clamp-2">
            {session.prompt || 'Speaking practice'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {session.date}
            {session.languageDetected ? ` · ${session.languageDetected}` : ''}
            {session.durationSeconds ? ` · ${session.durationSeconds}s` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className={cn('text-lg font-bold', scoreColor(session.overallScore))}>
              {session.overallScore}
            </p>
            <p className="text-xs text-muted-foreground">+{session.xpEarned} XP</p>
          </div>
          {open ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
          {session.components && (
            <div className="grid gap-2 sm:grid-cols-2">
              <DimensionBar label="Fluency" score={session.components.speechFluencyScore} />
              <DimensionBar label="Vocabulary" score={session.components.vocabularyScore} />
              <DimensionBar label="Structure" score={session.components.structureScore} />
              <DimensionBar label="Topic" score={session.components.topicRelevanceScore} />
              <DimensionBar label="Energy" score={session.components.energyScore} />
              <DimensionBar
                label="Consistency"
                score={session.components.practiceConsistencyScore}
              />
            </div>
          )}

          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <MetricPill label="WPM" value={session.paceWPM} />
            <MetricPill label="Words" value={session.wordCount ?? 0} />
            <MetricPill label="Pauses/min" value={session.pauseFrequency ?? 0} />
            <MetricPill
              label="Mindset"
              value={`${Number(localNlp.mindsetScore ?? 0)}%`}
            />
            <MetricPill
              label="Energy"
              value={`${Number(localAudio.energyScore ?? 0)}%`}
            />
          </div>

          {(pauseBreakdown.natural ?? 0) + (pauseBreakdown.thinking ?? 0) + (pauseBreakdown.lost ?? 0) > 0 && (
            <p className="text-xs text-muted-foreground">
              Pauses — natural: {pauseBreakdown.natural ?? 0}, thinking:{' '}
              {pauseBreakdown.thinking ?? 0}, lost: {pauseBreakdown.lost ?? 0}
            </p>
          )}

          {session.coachMessage && (
            <p className="text-sm text-foreground">{session.coachMessage}</p>
          )}

          {(session.strengths ?? []).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Strengths
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {session.strengths!.map((item) => (
                  <li key={item}>+ {item}</li>
                ))}
              </ul>
            </div>
          )}

          {(session.weaknesses ?? []).length > 0 && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-500">
                Improve
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {session.weaknesses!.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}

          {session.topicCoverage && (
            <p className="text-xs text-muted-foreground">
              Topic coverage: {session.topicCoverage.percent}%
              {session.topicCoverage.missing.length > 0 &&
                ` — missing: ${session.topicCoverage.missing.join(', ')}`}
            </p>
          )}

          {session.miniMission && (
            <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
              <span className="font-medium text-primary">Next mission: </span>
              {session.miniMission}
            </p>
          )}

          {session.transcript && (
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-4">
              {session.transcript}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function SpeechSessionList({ sessions }: SpeechSessionListProps) {
  if (!sessions.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          No speech sessions yet. Practice in the mobile app to see your analytics here.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Speech sessions</CardTitle>
        <p className="text-sm text-muted-foreground">
          Tap a session to view confidence dimensions, coaching, and local metrics.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sessions.slice(0, 12).map((session) => (
          <SessionCard key={session.id} session={session} />
        ))}
      </CardContent>
    </Card>
  );
}
