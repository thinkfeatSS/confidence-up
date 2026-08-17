import { SpeechSession } from '../types';

const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'literally', 'right', 'so'];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export const detectFillerWords = (transcript: string): string[] => {
  const lower = transcript.toLowerCase();
  const found = new Set<string>();

  for (const filler of FILLER_WORDS) {
    // Match whole word/phrase surrounded by spaces, punctuation, or brackets
    const pattern = new RegExp(`(?:^|[\\s\\[,(])${filler}(?=[\\s\\],.!?]|$)`, 'gi');
    if (pattern.test(lower)) {
      found.add(filler);
    }
  }

  return Array.from(found);
};

export const countFillerOccurrences = (transcript: string): number => {
  const lower = transcript.toLowerCase();
  let total = 0;

  for (const filler of FILLER_WORDS) {
    const pattern = new RegExp(`(?:^|[\\s\\[,(])${filler}(?=[\\s\\],.!?]|$)`, 'gi');
    const matches = lower.match(pattern);
    if (matches) total += matches.length;
  }

  return total;
};

export const estimatePaceWPM = (transcript: string, durationSeconds: number): number => {
  if (!transcript.trim() || durationSeconds <= 0) return 0;
  const wordCount = transcript.trim().split(/\s+/).length;
  return Math.round(wordCount / (durationSeconds / 60));
};

export const computeScores = (
  fillerCount: number,
  paceWPM: number,
): { clarityScore: number; toneScore: number; paceScore: number; overallScore: number } => {
  const clarityScore = clamp(95 - fillerCount * 5, 40, 95);
  const paceScore =
    paceWPM === 0 ? 60 : clamp(100 - Math.abs(paceWPM - 150) * 0.5, 40, 95);
  const toneScore = clamp(75 - fillerCount * 2, 45, 90);
  const overallScore = Math.round((clarityScore + toneScore + paceScore) / 3);
  return { clarityScore, toneScore, paceScore, overallScore };
};

export const generateFeedback = (
  fillerWords: string[],
  fillerCount: number,
  paceWPM: number,
): string[] => {
  const lines: string[] = [];

  // Filler word feedback
  if (fillerCount === 0) {
    lines.push('Excellent — zero filler words detected! Your speech is clean and confident.');
  } else if (fillerCount <= 2) {
    lines.push(
      `Great job — only ${fillerCount} filler word${fillerCount > 1 ? 's' : ''} detected. You're in the top 30% of users.`,
    );
  } else if (fillerCount <= 5) {
    lines.push(
      `${fillerCount} filler words detected (${fillerWords.join(', ')}). Try pausing silently instead of filling the gap.`,
    );
  } else {
    lines.push(
      `${fillerCount} filler words detected. This is the main area to improve — practice pausing silently when you lose your train of thought.`,
    );
  }

  // Pace feedback
  if (paceWPM === 0) {
    lines.push('No pace data available — make sure to speak for at least a few seconds.');
  } else if (paceWPM >= 120 && paceWPM <= 180) {
    lines.push(
      `Your pace of ${paceWPM} WPM is excellent — clear and digestible for listeners.`,
    );
  } else if (paceWPM > 180) {
    lines.push(
      `You're speaking quickly at ${paceWPM} WPM — try slowing down by 20–30 WPM so listeners can follow more easily.`,
    );
  } else {
    lines.push(
      `Your pace of ${paceWPM} WPM is a bit slow. Aim for 130–160 WPM to sound more natural and engaging.`,
    );
  }

  // General delivery tip
  if (fillerCount > 3) {
    lines.push(
      'Tip: Record yourself daily and replay it — hearing your own filler words is the fastest way to eliminate them.',
    );
  } else {
    lines.push(
      'Keep going! Consistency is key — even 2–3 minutes of daily practice will noticeably boost your confidence score.',
    );
  }

  return lines;
};

export const buildSpeechSession = (
  transcript: string,
  durationSeconds: number,
  prompt: string,
): SpeechSession => {
  const fillerWords = detectFillerWords(transcript);
  const fillerCount = countFillerOccurrences(transcript);
  const paceWPM = estimatePaceWPM(transcript, durationSeconds);
  const { clarityScore, toneScore, overallScore } = computeScores(fillerCount, paceWPM);
  const feedback = generateFeedback(fillerWords, fillerCount, paceWPM);

  const xpEarned =
    overallScore >= 80 ? 70 : overallScore >= 65 ? 50 : overallScore >= 50 ? 30 : 15;

  return {
    id: `speech-live-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    prompt,
    overallScore,
    clarityScore,
    fillerCount,
    paceWPM,
    toneScore,
    transcript,
    fillerWords,
    feedback,
    xpEarned,
  };
};
