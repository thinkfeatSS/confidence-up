import { GrowthMetricPoint, GrowthMetrics } from '../types/speechAnalysis.types';
import { SpeechSession } from '../../../types';

const percentChange = (current: number, baseline: number) => {
  if (!baseline) return 0;
  return Math.round(((current - baseline) / baseline) * 100);
};

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function buildTrend(sessions: SpeechSession[], pick: (session: SpeechSession) => number): GrowthMetricPoint[] {
  return [...sessions]
    .reverse()
    .slice(-14)
    .map(session => ({
      date: session.date,
      value: pick(session),
    }));
}

export function computeGrowthMetrics(
  sessions: SpeechSession[],
  streakDays = 0,
): GrowthMetrics {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const recent = sorted.slice(-7);
  const baseline = sorted.slice(0, 7);
  const scores = sorted.map(session => session.overallScore);
  const recentScores = recent.map(session => session.overallScore);
  const baselineScores = baseline.map(session => session.overallScore);

  const currentVocab = average(recent.map(session => session.vocabularyRichness ?? 0));
  const baselineVocab = average(baseline.map(session => session.vocabularyRichness ?? 0));
  const currentWpm = average(recent.map(session => session.paceWPM));
  const baselineWpm = average(baseline.map(session => session.paceWPM));
  const currentFillers = average(recent.map(session => session.fillerCount));
  const baselineFillers = average(baseline.map(session => session.fillerCount));
  const currentPauses = average(recent.map(session => session.pauseFrequency ?? 0));
  const baselinePauses = average(baseline.map(session => session.pauseFrequency ?? 0));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const sessionsLast30Days = sorted.filter(session => new Date(session.date) >= thirtyDaysAgo).length;

  return {
    confidence: {
      best: scores.length ? Math.max(...scores) : 0,
      average: average(scores),
      growthPercent: percentChange(average(recentScores), average(baselineScores)),
      trend: buildTrend(sorted.slice(-14), session => session.overallScore),
    },
    vocabulary: {
      uniqueWordsNow: Math.round(currentVocab),
      uniqueWordsBaseline: Math.round(baselineVocab),
      growthPercent: percentChange(currentVocab, baselineVocab),
    },
    wpm: {
      current: Math.round(currentWpm),
      baseline: Math.round(baselineWpm),
      changePercent: percentChange(currentWpm, baselineWpm),
    },
    fillers: {
      current: Math.round(currentFillers),
      baseline: Math.round(baselineFillers),
      reductionPercent: baselineFillers
        ? Math.round(((baselineFillers - currentFillers) / baselineFillers) * 100)
        : 0,
    },
    pauses: {
      current: currentPauses,
      baseline: baselinePauses,
      reductionPercent: baselinePauses
        ? Math.round(((baselinePauses - currentPauses) / baselinePauses) * 100)
        : 0,
    },
    components: {
      fluency: buildTrend(sorted.slice(-14), session => session.components?.speechFluencyScore ?? session.clarityScore),
      structure: buildTrend(sorted.slice(-14), session => session.components?.structureScore ?? 0),
      energy: buildTrend(sorted.slice(-14), session => session.components?.energyScore ?? 0),
      vocabulary: buildTrend(sorted.slice(-14), session => session.components?.vocabularyScore ?? 0),
    },
    consistency: {
      streakDays,
      sessionsLast7Days: recent.length,
      sessionsLast30Days,
    },
  };
}
