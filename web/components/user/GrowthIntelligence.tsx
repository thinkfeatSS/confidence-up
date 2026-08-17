import { StatCard } from '@/components/user/StatCard';
import type { GrowthMetrics } from '@/lib/mapSpeech';

type GrowthIntelligenceProps = {
  metrics: GrowthMetrics;
};

function formatDelta(value: number, suffix = '%') {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value}${suffix}`;
}

export function GrowthIntelligence({ metrics }: GrowthIntelligenceProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard icon="🏆" value={metrics.confidence.best} label="Best score" />
      <StatCard icon="📊" value={metrics.confidence.average} label="Average score" />
      <StatCard
        icon="📈"
        value={formatDelta(metrics.confidence.growthPercent)}
        label="Confidence growth"
      />
      <StatCard
        icon="📚"
        value={formatDelta(metrics.vocabulary.growthPercent)}
        label="Vocab richness growth"
      />
      <StatCard
        icon="🗣️"
        value={formatDelta(metrics.wpm.changePercent)}
        label="WPM change"
      />
      <StatCard
        icon="⏸️"
        value={formatDelta(metrics.pauses.reductionPercent)}
        label="Pause reduction"
      />
      <StatCard icon="🔥" value={metrics.consistency.streakDays} label="Day streak" />
    </div>
  );
}
