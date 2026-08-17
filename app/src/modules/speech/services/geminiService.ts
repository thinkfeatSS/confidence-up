import { apiClient, unwrapApiData } from '../../../services/api';
import {
  AiSpeechAnalysis,
  AudioMetrics,
  LanguageDetectionResult,
  NlpMetrics,
} from '../types/speechAnalysis.types';

export async function requestAiSpeechAnalysis(args: {
  transcript: string;
  topic: string;
  language: LanguageDetectionResult;
  nlp: NlpMetrics;
  audio: AudioMetrics;
  preferredLanguages?: string[];
}): Promise<AiSpeechAnalysis> {
  const res = await apiClient.post<any, any>('/speech/analyze-ai', {
    transcript: args.transcript,
    topic: args.topic,
    languageDetected: args.language.label,
    preferredLanguages: args.preferredLanguages ?? [],
    localLanguageConfidence: args.language.confidence,
    languageSummary: args.language,
    nlpSummary: args.nlp,
    audioSummary: args.audio,
    structuredPayload: {
      topic: args.topic,
      transcript: args.transcript,
      wpm: args.audio.speechSpeedWpm,
      pauseRatio: args.audio.pauseRatio,
      pauseBreakdown: args.audio.pauseBreakdown,
      fillerWords: args.nlp.fillerCount,
      hedgingCount: args.nlp.hedgingCount,
      structureScore: args.nlp.organizationScore,
      mindsetScore: args.nlp.mindsetScore,
      language: {
        label: args.language.label,
        stability: args.language.languageStability,
        romanUrduScore: args.language.romanUrduScore,
      },
    },
  });

  const data = unwrapApiData<AiSpeechAnalysis>(res);
  return {
    topicRelevanceScore: Math.max(0, Math.min(100, Math.round(data.topicRelevanceScore ?? 60))),
    coachingFeedback: data.coachingFeedback?.length
      ? data.coachingFeedback
      : ['Keep practicing. Focus on one clear idea and support it with an example.'],
    personalizedSuggestions: data.personalizedSuggestions?.length
      ? data.personalizedSuggestions
      : ['Try one more recording with a slower pace.'],
    personalizedExercises: data.personalizedExercises?.length
      ? data.personalizedExercises
      : ['Re-record with two transition words.', 'Cut filler words in half.'],
    miniMission: data.miniMission ?? 'Try again and improve one small thing.',
    strengths: data.strengths?.length ? data.strengths : ['You completed a practice session.'],
    weaknesses: data.weaknesses?.length ? data.weaknesses : [],
    coachMessage:
      data.coachMessage ??
      'Keep building momentum — focus on one improvement for your next attempt.',
    topicCoverage: data.topicCoverage,
    depthScore: data.depthScore,
    codeSwitchingQuality: data.codeSwitchingQuality,
    emotionalTone: data.emotionalTone,
    languageFallback: data.languageFallback,
    analysisMeta: data.analysisMeta,
  };
}
