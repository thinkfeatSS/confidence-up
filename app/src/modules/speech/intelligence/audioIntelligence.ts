import { AudioMetrics, AudioSample, PauseBreakdown } from '../types/speechAnalysis.types';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const MIN_PAUSE_MS = 300;
const GAP_PAUSE_MS = 500;
const LOW_VOLUME_THRESHOLD = 15;
const SPEECH_VOLUME_THRESHOLD = 22;

interface PauseInterval {
  startMs: number;
  endMs: number;
}

function collectPauseIntervals(samples: AudioSample[]): PauseInterval[] {
  if (!samples.length) return [];

  const intervals: PauseInterval[] = [];
  let lastPauseEnd = -Infinity;

  const registerPause = (startMs: number, endMs: number) => {
    const length = endMs - startMs;
    if (length < MIN_PAUSE_MS) return;
    if (startMs < lastPauseEnd + 200) return;
    intervals.push({ startMs, endMs });
    lastPauseEnd = endMs;
  };

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const gap = current.timestampMs - previous.timestampMs;
    if (gap >= GAP_PAUSE_MS) {
      registerPause(previous.timestampMs, current.timestampMs);
    }
  }

  let lowVolumeStart: number | null = null;
  for (const sample of samples) {
    if (sample.volume <= LOW_VOLUME_THRESHOLD) {
      if (lowVolumeStart === null) lowVolumeStart = sample.timestampMs;
    } else if (lowVolumeStart !== null) {
      registerPause(lowVolumeStart, sample.timestampMs);
      lowVolumeStart = null;
    }
  }

  const lastSample = samples[samples.length - 1];
  if (lowVolumeStart !== null && lastSample) {
    registerPause(lowVolumeStart, lastSample.timestampMs);
  }

  return intervals;
}

function classifyPauses(intervals: PauseInterval[]): PauseBreakdown {
  const breakdown: PauseBreakdown = { natural: 0, thinking: 0, lost: 0 };

  for (const interval of intervals) {
    const seconds = (interval.endMs - interval.startMs) / 1000;
    if (seconds >= 3) breakdown.lost += 1;
    else if (seconds >= 1) breakdown.thinking += 1;
    else breakdown.natural += 1;
  }

  return breakdown;
}

function calculateRhythmScore(samples: AudioSample[], durationSeconds: number) {
  if (!samples.length || durationSeconds <= 0) return 60;

  const bursts: number[] = [];
  let burstStart: number | null = null;
  let lastSpeechMs = 0;

  for (const sample of samples) {
    const isSpeech = sample.volume >= SPEECH_VOLUME_THRESHOLD;
    if (isSpeech) {
      if (burstStart === null) burstStart = sample.timestampMs;
      lastSpeechMs = sample.timestampMs;
    } else if (burstStart !== null) {
      bursts.push(lastSpeechMs - burstStart);
      burstStart = null;
    }
  }

  if (burstStart !== null) {
    bursts.push(Math.max(0, lastSpeechMs - burstStart));
  }

  if (bursts.length < 2) return 65;

  const mean = bursts.reduce((sum, value) => sum + value, 0) / bursts.length;
  const variance = bursts.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / bursts.length;
  const coefficient = mean > 0 ? Math.sqrt(variance) / mean : 1;
  return Math.round(clamp(100 - coefficient * 35));
}

export function enrichAudioMetrics(
  base: AudioMetrics,
  samples: AudioSample[],
  durationSeconds: number,
): AudioMetrics {
  const intervals = collectPauseIntervals(samples);
  const pauseBreakdown = classifyPauses(intervals);
  const pauseMs = intervals.reduce((sum, interval) => sum + (interval.endMs - interval.startMs), 0);
  const pauseRatio =
    durationSeconds > 0 ? Math.round((pauseMs / (durationSeconds * 1000)) * 100) / 100 : 0;

  const speakingRatio =
    durationSeconds > 0 ? base.activeSpeakingSeconds / durationSeconds : 0;
  const energyScore = Math.round(
    clamp(
      base.averageVolume * 0.35 +
        base.volumeStabilityScore * 0.35 +
        speakingRatio * 100 * 0.3,
    ),
  );
  const rhythmScore = calculateRhythmScore(samples, durationSeconds);

  return {
    ...base,
    pauseCount: intervals.length,
    pauseBreakdown,
    pauseRatio,
    energyScore,
    rhythmScore,
  };
}

export function emptyAudioEnrichment(): Pick<
  AudioMetrics,
  'pauseBreakdown' | 'energyScore' | 'rhythmScore' | 'pauseRatio'
> {
  return {
    pauseBreakdown: { natural: 0, thinking: 0, lost: 0 },
    energyScore: 0,
    rhythmScore: 60,
    pauseRatio: 0,
  };
}
