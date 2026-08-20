import { analyzeAudioSamples } from './audioAnalysisService';
import { analyzeTranscript } from './nlpService';
import { detectLanguage } from './languageDetector';
import { enrichLanguageDetection } from '../intelligence/languageIntelligence';
import { requestAiSpeechAnalysis } from './geminiService';
import {
  calculateConfidenceComponents,
  calculateConfidenceScore,
  xpForConfidence,
  buildMiniMission,
} from './confidenceEngine';
import {
  AiSpeechAnalysis,
  NlpMetrics,
  AudioMetrics,
  LanguageDetectionResult,
  SpeechAnalysisInput,
  SpeechAnalysisResult,
} from '../types/speechAnalysis.types';

function localTopicRelevance(transcript: string, topic: string) {
  const words = transcript.toLowerCase().split(/\s+/).filter(Boolean);
  const topicWords = topic.toLowerCase().split(/\s+/).filter(word => word.length > 3);
  if (!topicWords.length) return 70;
  const matched = topicWords.filter(word => words.some(spoken => spoken.includes(word)));
  return Math.max(45, Math.min(90, Math.round((matched.length / topicWords.length) * 100) || 55));
}

function fallbackAi(
  transcript: string,
  topic: string,
  nlp: NlpMetrics,
  audio: AudioMetrics,
  language: LanguageDetectionResult,
): AiSpeechAnalysis {
  const topicRelevanceScore = localTopicRelevance(transcript, topic);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (nlp.organizationScore >= 70) strengths.push('Well-structured delivery with clear transitions.');
  if (nlp.mindsetScore >= 70) strengths.push('Positive, confident language choices.');
  if (audio.energyScore >= 70) strengths.push('Strong vocal energy throughout.');
  if (nlp.organizationScore >= 60) strengths.push('Clear structure in your delivery.');

  if (nlp.hedgingCount > 3) weaknesses.push('Hedging language (maybe, I think) weakens your message.');
  if (audio.pauseBreakdown.lost > 0) weaknesses.push('Long pauses suggest losing your train of thought.');
  if (topicRelevanceScore < 65) weaknesses.push('Answer drifted from the prompt topic.');

  const coachMessage =
    topicRelevanceScore >= 70
      ? 'You stayed on topic with solid local metrics. Add one concrete example to elevate your next attempt.'
      : 'Focus your opening sentence directly on the prompt, then support it with a short example.';

  return {
    topicRelevanceScore,
    coachingFeedback: [
      topicRelevanceScore >= 70
        ? 'You stayed close to the prompt. Add one concrete example to make it stronger.'
        : 'Your answer needs a clearer connection to the prompt.',
      nlp.hedgingCount > 2
        ? 'Replace hedging phrases with direct statements.'
        : 'Use a short pause before your next key point.',
    ],
    personalizedSuggestions: [
      'Start with one direct sentence.',
      'End with a confident closing statement.',
    ],
    personalizedExercises: [
      'Record a 30-second answer using two transition words.',
      'Re-record and add one concrete example.',
    ],
    miniMission: 'Try again and make one point more specific.',
    strengths: strengths.length ? strengths : ['You completed a full practice session — great consistency.'],
    weaknesses: weaknesses.length ? weaknesses : ['Keep practicing to uncover more specific growth areas.'],
    coachMessage,
    topicCoverage: {
      percent: topicRelevanceScore,
      missing: topicRelevanceScore < 70 ? ['More direct mention of the prompt'] : [],
    },
    depthScore: Math.round((nlp.avgSentenceLength >= 8 ? 7.5 : 6) * 10) / 10,
    codeSwitchingQuality: language.romanUrduScore && language.romanUrduScore > 15 ? 65 : 80,
    emotionalTone: nlp.mindsetScore >= 70 ? 'Confident' : nlp.mindsetScore >= 50 ? 'Neutral' : 'Cautious',
    analysisMeta: { provider: 'local-fallback' },
  };
}

export async function analyzeSpeech(input: SpeechAnalysisInput): Promise<SpeechAnalysisResult> {
  const nlp = analyzeTranscript(input.transcript, input.durationSeconds);
  const audio = analyzeAudioSamples(input.audioSamples, nlp.wordCount, input.durationSeconds);
  const baseLanguage = detectLanguage({
    transcript: input.transcript,
    preferredLanguages: input.preferredLanguages,
    recentLanguages: input.recentLanguages,
  });
  const language = enrichLanguageDetection({
    base: baseLanguage,
    transcript: input.transcript,
    utteranceSegments: input.utteranceSegments,
    preferredLanguages: input.preferredLanguages,
  });

  let ai = fallbackAi(input.transcript, input.topic, nlp, audio, language);
  try {
    ai = await requestAiSpeechAnalysis({
      transcript: input.transcript,
      topic: input.topic,
      language,
      nlp,
      audio,
      preferredLanguages: input.preferredLanguages,
    });
  } catch {
    // Keep local fallback so practice works offline or without AI server availability.
  }

  const components = calculateConfidenceComponents({
    nlp,
    audio,
    topicRelevanceScore: ai.topicRelevanceScore,
    currentStreak: input.currentStreak,
    sessionsLast7Days: input.sessionsLast7Days,
    previousScore: input.previousScore,
  });
  const confidenceScore = calculateConfidenceScore(components);
  const preliminary = {
    transcript: input.transcript,
    topic: input.topic,
    durationSeconds: input.durationSeconds,
    language,
    nlp,
    audio,
    ai,
    components,
    confidenceScore,
    xpEarned: xpForConfidence(confidenceScore),
    missionId: input.missionId,
    challengeId: input.challengeId,
  };

  return {
    ...preliminary,
    ai: {
      ...ai,
      miniMission: ai.miniMission || buildMiniMission(preliminary),
    },
  };
}
