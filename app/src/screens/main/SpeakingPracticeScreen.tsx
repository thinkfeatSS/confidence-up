import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { XPGainFloat } from '../../components/gamification/XPGainFloat';
import { BadgeUnlockSheet } from '../../components/gamification/BadgeUnlockSheet';
import { LevelUpOverlay } from '../../components/gamification/LevelUpOverlay';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { apiClient, unwrapApiData } from '../../services/api';
import { toSpeechSessionDto, mapSpeechSessionFromApi } from '../../utils/apiHelpers';
import {
  buildSpeechCelebrations,
  highlightToBadge,
  SpeechCelebration,
  SpeechGamificationPayload,
} from '../../utils/speechCelebration';
import { useQueryClient } from '@tanstack/react-query';
import { RecordingState, SpeechSession } from '../../types';
import { MainTabParamList } from '../../navigation/types';
import { useUser } from '../../hooks/useUser';
import { useProgress } from '../../hooks/useProgress';
import { useSpeechRecorder } from '../../modules/speech/hooks/useSpeechRecorder';
import { useSpeechAnalysis } from '../../modules/speech/hooks/useSpeechAnalysis';
import { useLiveSpeechMetrics } from '../../modules/speech/hooks/useLiveSpeechMetrics';
import { SpeechAnalysisResult } from '../../modules/speech/types/speechAnalysis.types';

const PROMPTS = [
  'Introduce yourself as if meeting your dream employer',
  'Explain your biggest achievement in 60 seconds',
  'Convince a friend to try your favorite hobby',
  'Talk about a challenge you overcame',
];

const WaveBar = React.memo(({ height, isRecording }: { height: number; isRecording: boolean }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.waveBar,
        {
          height: isRecording ? height : 8,
          backgroundColor: isRecording ? colors.accentCyan : colors.textMuted,
          opacity: isRecording ? 1 : 0.3,
        },
      ]}
    />
  );
});

export const SpeakingPracticeScreen = () => {
  const route = useRoute<RouteProp<MainTabParamList, 'Practice'>>();
  const navigation = useNavigation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const { data: user } = useUser();
  const { data: progress } = useProgress();
  const [state, setState] = useState<RecordingState>('idle');
  const [processingStageIndex, setProcessingStageIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [showXP, setShowXP] = useState(false);
  const [celebrationQueue, setCelebrationQueue] = useState<SpeechCelebration[]>([]);
  const [celebrationIndex, setCelebrationIndex] = useState(0);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [retryComparison, setRetryComparison] = useState<{
    scoreDelta: number;
    fillerDelta: number;
    wpmDelta: number;
    previousScore: number;
  } | null>(null);

  const [session, setSession] = useState<SpeechSession | null>(null);
  const recorder = useSpeechRecorder(user?.preferredLanguages);
  const analysis = useSpeechAnalysis();
  const liveMetrics = useLiveSpeechMetrics(recorder, user?.preferredLanguages);

  const micScale = useSharedValue(1);
  const micStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }));
  const activePrompt = route.params?.prompt ?? PROMPTS[promptIndex];

  // Stage progress steps
  const STAGES = [
    { title: 'Uploading speech audio', icon: '📤' },
    { title: 'Transcribing speech (Whisper STT)', icon: '🎧' },
    { title: 'Analyzing fluency, pauses & vocabulary', icon: '📊' },
    { title: 'Generating AI Coaching & Strengths', icon: '🤖' },
    { title: 'Calculating Confidence Score (v1.0)', icon: '🎯' },
  ];

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (state === 'processing') {
      setProcessingStageIndex(0);
      interval = setInterval(() => {
        setProcessingStageIndex((prev) => (prev < STAGES.length - 1 ? prev + 1 : prev));
      }, 700);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  const buildSessionFromAnalysis = useCallback((
    result: SpeechAnalysisResult,
  ): SpeechSession => ({
    id: `speech-live-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    prompt: result.topic,
    overallScore: result.confidenceScore,
    clarityScore: result.components.speechFluencyScore,
    fillerCount: result.nlp.fillerCount,
    paceWPM: result.audio.speechSpeedWpm,
    toneScore: result.components.topicRelevanceScore,
    transcript: result.transcript,
    fillerWords: result.nlp.fillerWords,
    fillerBreakdown: result.nlp.fillerBreakdown,
    feedback: result.ai.coachingFeedback,
    xpEarned: result.xpEarned,
    languageDetected: result.language.label,
    sentenceCount: result.nlp.sentenceCount,
    wordCount: result.nlp.wordCount,
    vocabularyRichness: result.nlp.vocabularyRichness,
    repetitionScore: result.nlp.repetitionScore,
    averageVolume: result.audio.averageVolume,
    pauseFrequency: result.audio.pauseFrequency,
    components: result.components,
    localMetrics: {
      nlp: result.nlp,
      audio: result.audio,
      language: result.language,
    },
    aiInsights: {
      strengths: result.ai.strengths,
      weaknesses: result.ai.weaknesses,
      coachMessage: result.ai.coachMessage,
      topicCoverage: result.ai.topicCoverage,
      depthScore: result.ai.depthScore,
      emotionalTone: result.ai.emotionalTone,
      personalizedExercises: result.ai.personalizedExercises,
    },
    strengths: result.ai.strengths,
    weaknesses: result.ai.weaknesses,
    coachMessage: result.ai.coachMessage,
    topicCoverage: result.ai.topicCoverage,
    depthScore: result.ai.depthScore,
    emotionalTone: result.ai.emotionalTone,
    exercises: result.ai.personalizedExercises,
    analysisProvider: (result.ai.analysisMeta?.provider as string) ?? 'faster-whisper',
    suggestions: result.ai.personalizedSuggestions,
    miniMission: result.ai.miniMission,
    missionId: result.missionId,
    challengeId: result.challengeId,
  }), []);

  const startRecording = useCallback(async () => {
    setRecordingError(null);
    setSession(null);
    setRetryComparison(null);
    recorder.reset();
    micScale.value = withSpring(1.15, { damping: 4 });
    const started = await recorder.start();
    if (!started) {
      micScale.value = withSpring(1);
      return;
    }
    setState('recording');
  }, [micScale, recorder]);

  const stopRecording = useCallback(async () => {
    micScale.value = withSpring(1);
    setState('processing');

    const recording = await recorder.stop();
    if (!recording) {
      setState('idle');
      return;
    }
    const capturedText = recording.transcript?.trim() ?? '';
    if (!capturedText) {
      const spokeLongEnough = (recording?.durationSeconds ?? 0) >= 2;
      setRecordingError(
        spokeLongEnough
          ? 'No speech was detected. Speak clearly for a few seconds and watch for live transcript text before stopping.'
          : 'Speak for at least a couple of seconds, then tap stop.',
      );
      setState('idle');
      return;
    }

    const currentPrompt = activePrompt;
    const previousScore = progress?.speechSessions?.[0]?.overallScore;
    const previousFillers = progress?.speechSessions?.[0]?.fillerCount ?? 0;
    const previousWpm = progress?.speechSessions?.[0]?.paceWPM ?? 120;

    const result = await analysis.mutateAsync({
      transcript: recording.transcript,
      topic: currentPrompt,
      durationSeconds: recording.durationSeconds,
      audioSamples: recording.audioSamples,
      utteranceSegments: recording.utteranceSegments,
      preferredLanguages: user?.preferredLanguages,
      sessionsLast7Days: progress?.speechSessions?.slice(0, 7).length ?? 0,
      currentStreak: user?.streak ?? 0,
      previousScore: progress?.speechSessions?.[0]?.overallScore,
      missionId: route.params?.missionId,
      challengeId: route.params?.challengeId,
    });
    const built = buildSessionFromAnalysis(result);

    if (previousScore !== undefined) {
      setRetryComparison({
        scoreDelta: Math.round(built.overallScore - previousScore),
        fillerDelta: built.fillerCount - previousFillers,
        wpmDelta: Math.round(built.paceWPM - previousWpm),
        previousScore,
      });
    }

    try {
      const res = await apiClient.post<any, any>(
        '/speech/sessions',
        toSpeechSessionDto(built, recording.durationSeconds),
      );
      const payload = unwrapApiData<any>(res);
      const saved = mapSpeechSessionFromApi(payload, currentPrompt);
      setSession({ ...built, ...saved, prompt: currentPrompt, feedback: built.feedback });

      const gamification = payload?.gamification as SpeechGamificationPayload | undefined;
      setCelebrationQueue(
        buildSpeechCelebrations(built.xpEarned, gamification, {
          previousScore,
          currentScore: built.overallScore,
        }),
      );
      setCelebrationIndex(0);

      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
    } catch {
      setSession(built);
      setCelebrationQueue(
        buildSpeechCelebrations(built.xpEarned, undefined, {
          previousScore,
          currentScore: built.overallScore,
        }),
      );
      setCelebrationIndex(0);
    }
    setState('results');
    setShowXP(true);
  }, [activePrompt, analysis, buildSessionFromAnalysis, micScale, progress, queryClient, recorder, route.params, user]);

  const startFreshRecording = useCallback(() => {
    setState('idle');
    recorder.reset();
    setSession(null);
    setRecordingError(null);
    setRetryComparison(null);
  }, [recorder]);

  const tryAgain = useCallback(() => {
    startFreshRecording();
    setCelebrationQueue([]);
    setCelebrationIndex(0);
    setShowXP(false);
  }, [startFreshRecording]);

  const tryAnother = useCallback(() => {
    startFreshRecording();
    setCelebrationQueue([]);
    setCelebrationIndex(0);
    setShowXP(false);
    if (!route.params?.prompt) {
      setPromptIndex(i => (i + 1) % PROMPTS.length);
    }
    if (route.params?.missionId || route.params?.challengeId) {
      (navigation as any).setParams({ missionId: undefined, challengeId: undefined, prompt: undefined });
    }
  }, [navigation, route.params?.challengeId, route.params?.missionId, route.params?.prompt, startFreshRecording]);

  const advanceCelebration = useCallback(() => {
    setCelebrationIndex((index) => {
      const next = index + 1;
      if (next >= celebrationQueue.length) {
        return celebrationQueue.length;
      }
      return next;
    });
  }, [celebrationQueue.length]);

  const handleXPComplete = useCallback(() => {
    setShowXP(false);
    advanceCelebration();
  }, [advanceCelebration]);

  const handleCelebrationDismiss = useCallback(() => {
    advanceCelebration();
  }, [advanceCelebration]);

  const activeCelebration = celebrationQueue[celebrationIndex];
  const showLevelUp = activeCelebration?.kind === 'levelUp';
  const showBadgeSheet =
    activeCelebration?.kind === 'badge' || activeCelebration?.kind === 'highlight';
  const badgeForSheet =
    activeCelebration?.kind === 'badge'
      ? activeCelebration.badge
      : activeCelebration?.kind === 'highlight'
        ? highlightToBadge(activeCelebration)
        : null;
  const badgeSheetSubtitle =
    activeCelebration?.kind === 'highlight' ? 'SESSION HIGHLIGHT' : 'ACHIEVEMENT UNLOCKED';

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const scoreColor = (n: number) =>
    n >= 80 ? colors.success : n >= 60 ? colors.xpGold : colors.danger;

  return (
    <GradientBackground style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>🎤 Speaking Practice</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>AI-Powered Confidence Coach</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Prompt Card */}
        <GlassCard>
          <Text style={[styles.promptLabel, { color: colors.accentCyan }]}>YOUR PROMPT</Text>
          <Text style={[styles.promptText, { color: colors.textPrimary }]}>{activePrompt}</Text>
          <Text style={[styles.languageHint, { color: colors.textMuted }]}>
            🌐 Multilingual Engine: Speak naturally in English, Urdu, Sindhi, Hindi, or Mixed code-switching.
          </Text>
          {state === 'idle' && !route.params?.prompt && (
            <TouchableOpacity onPress={() => setPromptIndex(i => (i + 1) % PROMPTS.length)} activeOpacity={0.7}>
              <Text style={[styles.shuffleText, { color: colors.accentCyan }]}>🔀 Shuffle Prompt</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        {/* Recording Area */}
        {(state === 'idle' || state === 'recording') && (
          <GlassCard style={styles.recordCard}>
            {/* Waveform */}
            <View style={styles.waveform}>
              {recorder.waveform.map((h, i) => (
                <WaveBar key={i} height={h} isRecording={state === 'recording'} />
              ))}
            </View>

            {state === 'recording' && (
              <Text style={[styles.timer, { color: colors.textPrimary }]}>{formatTime(recorder.durationSeconds)}</Text>
            )}

            {state === 'recording' && (
              <View style={styles.liveMetricsBar}>
                <LiveMetric label="WPM" value={liveMetrics.wpm} />
                <LiveMetric label="Volume" value={`${liveMetrics.averageVolume}%`} />
                <LiveMetric label="Language" value={liveMetrics.languageLabel} compact />
              </View>
            )}

            {state === 'recording' && !recorder.transcript && (
              <Text style={[styles.listeningHint, { color: colors.accentCyan }]}>
                {recorder.isListening ? '🎙️ Listening… speak clearly' : '⏳ Initializing microphone…'}
              </Text>
            )}

            {recorder.transcript.length > 0 && (
              <View style={[styles.liveTranscriptBox, { borderColor: colors.border, backgroundColor: colors.bgInput }]}>
                <Text style={[styles.liveTranscriptLabel, { color: colors.accentCyan }]}>LIVE TRANSCRIPT</Text>
                <Text style={[styles.liveTranscript, { color: colors.textSecondary }]}>{recorder.transcript}</Text>
              </View>
            )}

            <Animated.View style={micStyle}>
              <TouchableOpacity
                style={[
                  styles.micBtn,
                  { backgroundColor: colors.accentPurple, shadowColor: colors.glowPurple },
                  state === 'recording' && { backgroundColor: colors.danger, shadowColor: colors.danger },
                ]}
                onPress={state === 'idle' ? startRecording : stopRecording}
                activeOpacity={0.85}>
                <Text style={{ fontSize: 36 }}>{state === 'recording' ? '⏹️' : '🎤'}</Text>
              </TouchableOpacity>
            </Animated.View>

            <Text style={[styles.micHint, { color: colors.textMuted }]}>
              {state === 'idle' ? 'Tap to start recording' : 'Tap to stop & analyze'}
            </Text>
            {(recordingError || recorder.error) && (
              <Text style={[styles.errorText, { color: colors.danger }]}>{recordingError ?? recorder.error}</Text>
            )}
          </GlassCard>
        )}

        {/* Multi-Stage Animated Processing */}
        {state === 'processing' && (
          <GlassCard style={styles.processingCard} glowColor={colors.accentPurple}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>⚡</Text>
            <Text style={[styles.processingText, { color: colors.textPrimary }]}>Analyzing Your Speech</Text>
            <Text style={[styles.processingSub, { color: colors.textMuted }]}>
              Processing through Confidence Intelligence Pipeline
            </Text>

            <View style={styles.stageProgressList}>
              {STAGES.map((stg, idx) => {
                const isDone = idx < processingStageIndex;
                const isCurrent = idx === processingStageIndex;
                return (
                  <View key={idx} style={styles.stageRow}>
                    <Text style={styles.stageIcon}>{isDone ? '✅' : isCurrent ? '●' : '○'}</Text>
                    <Text
                      style={[
                        styles.stageTitle,
                        {
                          color: isDone
                            ? colors.success
                            : isCurrent
                            ? colors.accentCyan
                            : colors.textMuted,
                          fontWeight: isCurrent ? '700' : '500',
                        },
                      ]}>
                      {stg.icon} {stg.title}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GlassCard>
        )}

        {/* Enhanced Results Screen */}
        {state === 'results' && session && (
          <View style={{ gap: Spacing.md }}>
            {/* Score Hero */}
            <GlassCard style={styles.scoreHero} glowColor={colors.accentPurple}>
              <Text style={[styles.scoreNumber, { color: scoreColor(session.overallScore) }]}>
                {session.overallScore}
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Confidence Score (v1.0)</Text>

              {/* Retry Growth Comparison Badge */}
              {retryComparison && retryComparison.scoreDelta !== 0 && (
                <View
                  style={[
                    styles.retryBadge,
                    {
                      backgroundColor:
                        retryComparison.scoreDelta > 0 ? `${colors.success}20` : `${colors.danger}20`,
                      borderColor:
                        retryComparison.scoreDelta > 0 ? colors.success : colors.danger,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.retryBadgeText,
                      {
                        color: retryComparison.scoreDelta > 0 ? colors.success : colors.danger,
                      },
                    ]}>
                    {retryComparison.scoreDelta > 0 ? '▲ +' : '▼ '}
                    {retryComparison.scoreDelta} confidence growth from previous attempt
                  </Text>
                </View>
              )}

              <Text style={[styles.xpEarned, { color: colors.xpGold }]}>+{session.xpEarned} XP earned 🪙</Text>
              {session.languageDetected && (
                <Text style={[styles.languageBadge, { color: colors.accentCyan }]}>🌐 {session.languageDetected}</Text>
              )}
            </GlassCard>

            {/* Confidence Dimensions */}
            <GlassCard>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>CONFIDENCE DIMENSIONS</Text>
              <ScoreRow label="Fluency (30%)" score={session.components?.speechFluencyScore ?? session.clarityScore} />
              <ScoreRow label="Topic (30%)" score={session.components?.topicRelevanceScore ?? session.toneScore} />
              <ScoreRow label="Vocabulary (20%)" score={session.components?.vocabularyScore ?? 0} />
              <ScoreRow label="Consistency (20%)" score={session.components?.practiceConsistencyScore ?? 0} />
              <ScoreRow label="Structure" score={session.components?.structureScore ?? 0} />
              <ScoreRow label="Energy" score={session.components?.energyScore ?? 0} />
            </GlassCard>

            {/* Speech Analytics Grid */}
            <GlassCard>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>SPEECH METRICS</Text>
              <View style={styles.metricGrid}>
                <Metric label="Pace (WPM)" value={session.paceWPM} />
                <Metric label="Word count" value={session.wordCount ?? 0} />
                <Metric label="Sentences" value={session.sentenceCount ?? 0} />
                <Metric label="Filler words" value={session.fillerCount} />
                <Metric label="Pauses/min" value={session.pauseFrequency ?? 0} />
                <Metric label="Thinking pauses" value={(session.localMetrics as any)?.audio?.pauseBreakdown?.thinking ?? 0} />
                <Metric label="Lost pauses" value={(session.localMetrics as any)?.audio?.pauseBreakdown?.lost ?? 0} />
                <Metric label="Transitions" value={(session.localMetrics as any)?.nlp?.transitionCount ?? 0} />
                <Metric label="Mindset score" value={`${(session.localMetrics as any)?.nlp?.mindsetScore ?? 80}%`} />
              </View>

              {((session.localMetrics as any)?.nlp?.repeatedPhrases ?? []).length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.insightLabel, { color: colors.accentCyan }]}>Repeated phrases</Text>
                  <View style={styles.chipRow}>
                    {((session.localMetrics as any)?.nlp?.repeatedPhrases as string[]).map((phrase, index) => (
                      <View key={index} style={[styles.fillerChip, { backgroundColor: `${colors.danger}20`, borderColor: `${colors.danger}45` }]}>
                        <Text style={[styles.fillerText, { color: colors.danger }]}>{phrase}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </GlassCard>

            {/* Next Improvement Mission */}
            <GlassCard glowColor={colors.xpGold}>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>🎯 NEXT IMPROVEMENT MISSION</Text>
              <Text style={[styles.miniMission, { color: colors.textPrimary }]}>
                {session.miniMission ?? 'Try again and reduce filler words.'}
              </Text>
            </GlassCard>

            {/* AI Coach Atlas */}
            <GlassCard glowColor={colors.accentCyan}>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>
                🤖 ATLAS COACH FEEDBACK
              </Text>
              {session.coachMessage && (
                <Text style={[styles.coachMessage, { color: colors.textPrimary }]}>{session.coachMessage}</Text>
              )}
              {(session.strengths ?? []).length > 0 && (
                <>
                  <Text style={[styles.insightLabel, { color: colors.accentCyan }]}>Key Strengths</Text>
                  {(session.strengths ?? []).map((item, index) => (
                    <Text key={`strength-${index}`} style={[styles.feedbackItem, { color: colors.textSecondary }]}>✓ {item}</Text>
                  ))}
                </>
              )}
              {(session.weaknesses ?? []).length > 0 && (
                <>
                  <Text style={[styles.insightLabel, { color: colors.accentCyan }]}>Areas for Growth</Text>
                  {(session.weaknesses ?? []).map((item, index) => (
                    <Text key={`weakness-${index}`} style={[styles.suggestionItem, { color: colors.accentCyan }]}>• {item}</Text>
                  ))}
                </>
              )}
              {(session.suggestions ?? []).map((s, i) => (
                <Text key={`sugg-${i}`} style={[styles.suggestionItem, { color: colors.accentCyan }]}>💡 Action: {s}</Text>
              ))}
            </GlassCard>

            {/* Retry Actions */}
            <View style={styles.retryRow}>
              <PrimaryButton label="Try Again 🔁" onPress={tryAgain} style={styles.retryButton} />
              <PrimaryButton label="Try Another ➡️" onPress={tryAnother} variant="outline" style={styles.retryButton} />
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {showXP && session && celebrationIndex === 0 && celebrationQueue[0]?.kind === 'xp' && (
        <XPGainFloat amount={session.xpEarned} onComplete={handleXPComplete} />
      )}
      <LevelUpOverlay
        visible={showLevelUp}
        newLevel={activeCelebration?.kind === 'levelUp' ? activeCelebration.level : 1}
        newTitle={activeCelebration?.kind === 'levelUp' ? activeCelebration.title : ''}
        onDismiss={handleCelebrationDismiss}
      />
      <BadgeUnlockSheet
        visible={showBadgeSheet}
        badge={badgeForSheet}
        subtitle={badgeSheetSubtitle}
        onDismiss={handleCelebrationDismiss}
      />
    </GradientBackground>
  );
};

const LiveMetric = ({ label, value, compact }: { label: string; value: string | number; compact?: boolean }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.liveMetricCard,
        compact && styles.liveMetricCompact,
        { borderColor: `${colors.accentCyan}35`, backgroundColor: `${colors.accentCyan}15` },
      ]}>
      <Text style={[styles.liveMetricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.liveMetricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

const ScoreRow = ({ label, score }: { label: string; score: number }) => {
  const { colors } = useTheme();
  const barColor = score >= 80 ? colors.success : score >= 60 ? colors.xpGold : colors.danger;
  return (
    <View style={styles.scoreRow}>
      <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.scoreBarTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.scoreBarFill, { width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.breakdownValue, { color: barColor }]}>{score}</Text>
    </View>
  );
};

const Metric = ({ label, value }: { label: string; value: string | number }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.bgCardElevated, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 56, paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, gap: 4 },
  title: { fontSize: 22, fontWeight: '800' },
  sub: { ...(Typography.bodySmall as object) },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 80 },
  promptLabel: { ...(Typography.caption as object), letterSpacing: 1.5, marginBottom: 6 },
  promptText: { fontSize: 17, fontWeight: '600', lineHeight: 26 },
  languageHint: { ...(Typography.caption as object), marginTop: 8 },
  shuffleText: { ...(Typography.bodySmall as object), marginTop: 8 },
  recordCard: { alignItems: 'center', gap: Spacing.base, paddingVertical: 32 },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 48 },
  waveBar: { width: 4, borderRadius: 2 },
  timer: { fontSize: 32, fontWeight: '700', fontVariant: ['tabular-nums'] },
  liveMetricsBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', width: '100%' },
  liveMetricCard: { minWidth: 72, paddingHorizontal: 10, paddingVertical: 8, borderRadius: BorderRadius.md, borderWidth: 1, alignItems: 'center' },
  liveMetricCompact: { minWidth: 96 },
  liveMetricValue: { fontSize: 14, fontWeight: '800' },
  liveMetricLabel: { ...(Typography.caption as object), marginTop: 2 },
  listeningHint: { ...(Typography.bodySmall as object), textAlign: 'center' },
  liveTranscriptBox: { width: '100%', borderWidth: 1, borderRadius: BorderRadius.md, padding: 12 },
  liveTranscriptLabel: { ...(Typography.caption as object), marginBottom: 4 },
  liveTranscript: { ...(Typography.bodySmall as object), lineHeight: 20 },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 12,
  },
  micHint: { ...(Typography.caption as object) },
  errorText: { ...(Typography.bodySmall as object), textAlign: 'center' },
  processingCard: { alignItems: 'center', gap: Spacing.sm, paddingVertical: 32 },
  processingText: { fontSize: 18, fontWeight: '700' },
  processingSub: { ...(Typography.bodySmall as object), textAlign: 'center', marginBottom: 16 },
  stageProgressList: { width: '100%', paddingHorizontal: Spacing.sm, gap: 10 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageIcon: { fontSize: 14 },
  stageTitle: { fontSize: 13 },
  scoreHero: { alignItems: 'center', gap: 4 },
  scoreNumber: { fontSize: 64, fontWeight: '900', lineHeight: 70 },
  scoreLabel: { ...(Typography.body as object) },
  retryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 6 },
  retryBadgeText: { fontSize: 12, fontWeight: '700' },
  xpEarned: { fontSize: 14, fontWeight: '700', marginTop: 4 },
  languageBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 12, fontWeight: '700' },
  sectionLabel: { ...(Typography.caption as object), letterSpacing: 1.5, marginBottom: 12 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 10 },
  breakdownLabel: { width: 110, fontSize: 13, fontWeight: '500' },
  scoreBarTrack: { flex: 1, height: 6, borderRadius: 3 },
  scoreBarFill: { height: 6, borderRadius: 3 },
  breakdownValue: { width: 32, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metricCard: { width: '30%', minWidth: 86, padding: 10, borderRadius: BorderRadius.md, borderWidth: 1 },
  metricValue: { fontSize: 16, fontWeight: '800' },
  metricLabel: { ...(Typography.caption as object), marginTop: 2 },
  miniMission: { ...(Typography.body as object), lineHeight: 24, fontWeight: '600' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  fillerChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  fillerText: { fontSize: 13, fontWeight: '500' },
  coachMessage: { ...(Typography.body as object), lineHeight: 24, fontWeight: '600', marginBottom: 8 },
  insightLabel: { ...(Typography.caption as object), marginTop: 8, marginBottom: 4, letterSpacing: 1 },
  feedbackItem: { ...(Typography.body as object), lineHeight: 24, marginBottom: 6 },
  suggestionItem: { ...(Typography.bodySmall as object), lineHeight: 22, marginTop: 4 },
  retryRow: { flexDirection: 'row', gap: Spacing.sm },
  retryButton: { flex: 1 },
});
