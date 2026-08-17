import { AudioMetrics, AudioSample } from '../types/speechAnalysis.types';
import { emptyAudioEnrichment, enrichAudioMetrics } from '../intelligence/audioIntelligence';

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));
const MIN_PAUSE_MS = 400;
const GAP_PAUSE_MS = 500;
const LOW_VOLUME_THRESHOLD = 15;

export function normalizeMetering(value?: number) {
  if (value === undefined || !Number.isFinite(value)) return 0;
  if (value >= 0 && value <= 1) return Math.round(value * 100);
  if (value >= 0 && value <= 100) return Math.round(value);
  // Native metering is commonly dB from about -60 to 0.
  return Math.round(clamp(((value + 60) / 60) * 100));
}

function countPauses(samples: AudioSample[]) {
  if (!samples.length) return { pauseCount: 0, pauseMs: 0 };

  let pauseCount = 0;
  let pauseMs = 0;
  let lastPauseEnd = -Infinity;

  const registerPause = (startMs: number, endMs: number) => {
    const length = endMs - startMs;
    if (length < MIN_PAUSE_MS) return;
    if (startMs < lastPauseEnd + 200) return;
    pauseCount += 1;
    pauseMs += length;
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

  return { pauseCount, pauseMs };
}

export function analyzeAudioSamples(
  samples: AudioSample[],
  wordCount: number,
  durationSeconds: number,
): AudioMetrics {
  if (!samples.length) {
    const speechSpeedWpm = durationSeconds > 0 ? Math.round(wordCount / (durationSeconds / 60)) : 0;
    return {
      averageVolume: 0,
      pauseCount: 0,
      pauseFrequency: 0,
      activeSpeakingSeconds: durationSeconds,
      speechSpeedWpm,
      volumeStabilityScore: 60,
      ...emptyAudioEnrichment(),
    };
  }

  const volumes = samples.map(sample => clamp(sample.volume));
  const averageVolume = Math.round(volumes.reduce((sum, v) => sum + v, 0) / volumes.length);
  const mean = averageVolume;
  const variance = volumes.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / volumes.length;
  const volumeStabilityScore = Math.round(clamp(100 - Math.sqrt(variance) * 2));

  const { pauseCount, pauseMs } = countPauses(samples);

  const activeSpeakingSeconds = Math.max(1, durationSeconds - pauseMs / 1000);
  const speechSpeedWpm = Math.round(wordCount / (activeSpeakingSeconds / 60));
  const pauseFrequency = durationSeconds > 0 ? Math.round((pauseCount / (durationSeconds / 60)) * 10) / 10 : 0;

  return enrichAudioMetrics(
    {
      averageVolume,
      pauseCount,
      pauseFrequency,
      activeSpeakingSeconds,
      speechSpeedWpm,
      volumeStabilityScore,
      pauseBreakdown: { natural: 0, thinking: 0, lost: 0 },
      energyScore: 0,
      rhythmScore: 60,
      pauseRatio: 0,
    },
    samples,
    durationSeconds,
  );
}

export function calculateFluencyScore(args: {
  speechSpeedWpm: number;
  pauseFrequency: number;
  averageVolume: number;
  volumeStabilityScore: number;
  repetitionScore: number;
}) {
  const paceScore =
    args.speechSpeedWpm <= 0
      ? 50
      : clamp(100 - Math.abs(args.speechSpeedWpm - 145) * 0.7);
  const pauseScore = clamp(100 - args.pauseFrequency * 8);
  const volumeScore = args.averageVolume < 10 ? 45 : args.volumeStabilityScore;
  const repetitionPenaltyScore = args.repetitionScore;

  return Math.round(
    0.4 * paceScore +
      0.3 * pauseScore +
      0.2 * volumeScore +
      0.1 * repetitionPenaltyScore,
  );
}
