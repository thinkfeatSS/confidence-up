import { useEffect, useMemo, useRef, useState } from 'react';
import { detectLanguage } from '../services/languageDetector';
import { LiveSpeechMetrics } from '../types/speechAnalysis.types';
type RecorderLike = {
  transcript: string;
  durationSeconds: number;
  liveAverageVolume: number;
  isRecording: boolean;
};

export function useLiveSpeechMetrics(
  recorder: RecorderLike,
  preferredLanguages?: string[],
) {
  const [metrics, setMetrics] = useState<LiveSpeechMetrics>({
    wpm: 0,
    averageVolume: 0,
    languageLabel: 'Detecting…',
  });
  const lastUpdateRef = useRef(0);

  const wordCount = useMemo(
    () => recorder.transcript.trim().split(/\s+/).filter(Boolean).length,
    [recorder.transcript],
  );

  useEffect(() => {
    if (!recorder.isRecording) return;

    const now = Date.now();
    if (now - lastUpdateRef.current < 300) return;
    lastUpdateRef.current = now;

    const durationMinutes = Math.max(recorder.durationSeconds / 60, 1 / 60);
    const wpm = Math.round(wordCount / durationMinutes);

    const language =
      recorder.transcript.trim().length >= 8
        ? detectLanguage({
            transcript: recorder.transcript,
            preferredLanguages,
          })
        : null;

    setMetrics({
      wpm,
      averageVolume: recorder.liveAverageVolume,
      languageLabel: language?.label ?? 'Detecting…',
    });
  }, [
    recorder.isRecording,
    recorder.transcript,
    recorder.durationSeconds,
    recorder.liveAverageVolume,
    preferredLanguages,
    wordCount,
  ]);

  return metrics;
}
