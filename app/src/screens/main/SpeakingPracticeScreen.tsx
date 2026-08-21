import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import Animated, { useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { GradientBackground } from '../../components/common/GradientBackground';
import { GlassCard } from '../../components/common/GlassCard';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { XPGainFloat } from '../../components/gamification/XPGainFloat';
import { BadgeUnlockSheet } from '../../components/gamification/BadgeUnlockSheet';
import { LevelUpOverlay } from '../../components/gamification/LevelUpOverlay';
import { SpeakingPracticeListModal } from '../../components/speech/SpeakingPracticeListModal';
import { Spacing, BorderRadius, Typography } from '../../theme';
import { useTheme } from '../../theme/ThemeContext';
import { apiClient, unwrapApiData } from '../../services/api';
import { toSpeechSessionDto, mapSpeechSessionFromApi } from '../../utils/apiHelpers';
import { saveLocalSpeechSession } from '../../services/localSpeechStorage';
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
import { SPEAKING_PRACTICES, SpeakingPracticeItem } from '../../data/speakingPractices';

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
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [customPrompt, setCustomPrompt] = useState<string | null>(null);
  const [showPracticeListModal, setShowPracticeListModal] = useState(false);
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
  const [newTopicPersonalRecord, setNewTopicPersonalRecord] = useState<{
    currentScore: number;
    previousBest: number;
  } | null>(null);

  const [session, setSession] = useState<SpeechSession | null>(null);
  const recorder = useSpeechRecorder(user?.preferredLanguages);
  const analysis = useSpeechAnalysis();
  const liveMetrics = useLiveSpeechMetrics(recorder, user?.preferredLanguages);

  const micScale = useSharedValue(1);
  const micStyle = useAnimatedStyle(() => ({ transform: [{ scale: micScale.value }] }));
  
  const activePrompt = customPrompt ?? route.params?.prompt ?? SPEAKING_PRACTICES[practiceIndex].prompt;

  // Best past score for current active prompt
  const currentPromptBestScore = useMemo(() => {
    if (!progress?.speechSessions || progress.speechSessions.length === 0) return undefined;
    const normalized = activePrompt.toLowerCase().trim();
    const matching = progress.speechSessions.filter((s) => {
      if (!s.prompt || s.overallScore === undefined) return false;
      const sNorm = s.prompt.toLowerCase().trim();
      return (
        sNorm === normalized ||
        sNorm.includes(normalized.slice(0, 25)) ||
        normalized.includes(sNorm.slice(0, 25))
      );
    });
    if (matching.length === 0) return undefined;
    return Math.max(...matching.map((m) => m.overallScore));
  }, [progress?.speechSessions, activePrompt]);

  // Stage progress steps
  const STAGES = [
    { title: 'Uploading speech audio', icon: '📤' },
    { title: 'Transcribing speech & word confidence', icon: '🎧' },
    { title: 'Analyzing pronunciation, fluency & fillers', icon: '📊' },
    { title: 'Generating AI Coaching & Feedback', icon: '🤖' },
    { title: 'Calculating Confidence Score (v2.0)', icon: '🎯' },
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
    setNewTopicPersonalRecord(null);
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
    const prevBest = currentPromptBestScore;

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

    if (prevBest !== undefined && built.overallScore > prevBest) {
      setNewTopicPersonalRecord({
        currentScore: built.overallScore,
        previousBest: prevBest,
      });
    } else {
      setNewTopicPersonalRecord(null);
    }

    // Save locally right away to guarantee it shows in history even if offline/backend delays
    await saveLocalSpeechSession(built);
    queryClient.setQueryData(['progress', 'speeches'], (old: any) => {
      const list = Array.isArray(old) ? old : [];
      return [built, ...list.filter((item: any) => item.id !== built.id)];
    });

    try {
      const res = await apiClient.post<any, any>(
        '/speech/sessions',
        toSpeechSessionDto(built, recording.durationSeconds),
      );
      const payload = unwrapApiData<any>(res);
      const saved = mapSpeechSessionFromApi(payload, currentPrompt);
      const mergedSession = { ...built, ...saved, prompt: currentPrompt, feedback: built.feedback };
      setSession(mergedSession);
      await saveLocalSpeechSession(mergedSession);

      const gamification = payload?.gamification as SpeechGamificationPayload | undefined;
      setCelebrationQueue(
        buildSpeechCelebrations(built.xpEarned, gamification, {
          previousScore,
          currentScore: built.overallScore,
        }),
      );
      setCelebrationIndex(0);

      queryClient.setQueryData(['progress', 'speeches'], (old: any) => {
        const list = Array.isArray(old) ? old : [];
        return [mergedSession, ...list.filter((item: any) => item.id !== built.id && item.id !== mergedSession.id)];
      });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['badges'] });
      queryClient.invalidateQueries({ queryKey: ['gamification'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    } catch (err) {
      console.warn('[SpeakingPracticeScreen] Remote save failed, preserved locally:', err);
      setSession(built);
      setCelebrationQueue(
        buildSpeechCelebrations(built.xpEarned, undefined, {
          previousScore,
          currentScore: built.overallScore,
        }),
      );
      setCelebrationIndex(0);
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    }
    setState('results');
    setShowXP(true);
  }, [
    activePrompt,
    analysis,
    buildSessionFromAnalysis,
    currentPromptBestScore,
    micScale,
    progress,
    queryClient,
    recorder,
    route.params,
    user,
  ]);

  const startFreshRecording = useCallback(() => {
    setState('idle');
    recorder.reset();
    setSession(null);
    setRecordingError(null);
    setRetryComparison(null);
    setNewTopicPersonalRecord(null);
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
    setCustomPrompt(null);
    if (!route.params?.prompt) {
      setPracticeIndex((i) => (i + 1) % SPEAKING_PRACTICES.length);
    }
    if (route.params?.missionId || route.params?.challengeId) {
      (navigation as any).setParams({ missionId: undefined, challengeId: undefined, prompt: undefined });
    }
  }, [navigation, route.params?.challengeId, route.params?.missionId, route.params?.prompt, startFreshRecording]);

  const handleSelectPracticeTopic = useCallback((practice: SpeakingPracticeItem) => {
    setCustomPrompt(practice.prompt);
    startFreshRecording();
    setCelebrationQueue([]);
    setCelebrationIndex(0);
    setShowXP(false);
  }, [startFreshRecording]);

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

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const scoreColor = (n: number) =>
    n >= 80 ? colors.success : n >= 60 ? colors.xpGold : colors.danger;

  return (
    <GradientBackground style={styles.container}>
      {/* Header with Topic Library Button */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
            adjustsFontSizeToFit>
            🎤 Speaking Practice
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>
            AI-Powered Confidence Coach
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.topicsBtn, { backgroundColor: colors.bgInput, borderColor: colors.border }]}
          onPress={() => setShowPracticeListModal(true)}
          activeOpacity={0.8}>
          <Text style={[styles.topicsBtnText, { color: colors.accentCyan }]}>📋 Topics</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Prompt Card */}
        <GlassCard>
          <View style={styles.promptHeaderRow}>
            <Text style={[styles.promptLabel, { color: colors.accentCyan }]}>YOUR PROMPT</Text>
            {currentPromptBestScore !== undefined && (
              <View style={[styles.bestScorePill, { backgroundColor: `${getScoreBadgeColor(currentPromptBestScore, colors)}20`, borderColor: getScoreBadgeColor(currentPromptBestScore, colors) }]}>
                <Text style={[styles.bestScoreText, { color: getScoreBadgeColor(currentPromptBestScore, colors) }]}>
                  🏆 Best: {currentPromptBestScore}/100
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.promptText, { color: colors.textPrimary }]}>{activePrompt}</Text>
          <Text style={[styles.languageHint, { color: colors.textMuted }]}>
            🌐 Multilingual Engine: Speak naturally in English, Urdu, Sindhi, Hindi, or Mixed code-switching.
          </Text>
          
          {state === 'idle' && (
            <View style={styles.promptActionsRow}>
              <TouchableOpacity
                onPress={() => setShowPracticeListModal(true)}
                activeOpacity={0.7}
                style={styles.actionBtn}>
                <Text style={[styles.actionBtnText, { color: colors.accentCyan }]}>📑 View All Topics</Text>
              </TouchableOpacity>
              {!route.params?.prompt && (
                <TouchableOpacity
                  onPress={() => {
                    setCustomPrompt(null);
                    setPracticeIndex((i) => (i + 1) % SPEAKING_PRACTICES.length);
                  }}
                  activeOpacity={0.7}
                  style={styles.actionBtn}>
                  <Text style={[styles.actionBtnText, { color: colors.accentPurpleLight }]}>🔀 Next Topic</Text>
                </TouchableOpacity>
              )}
            </View>
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
              <Text style={[styles.timer, { color: colors.textPrimary }]}>
                {formatTime(recorder.durationSeconds)}
              </Text>
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
              Evaluating Fluency, Pronunciation & Articulation
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
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>Confidence Score (v2.0)</Text>

              {/* Personal Record on Topic Badge */}
              {newTopicPersonalRecord && (
                <View
                  style={[
                    styles.personalBestBanner,
                    { backgroundColor: `${colors.success}20`, borderColor: colors.success },
                  ]}>
                  <Text style={[styles.personalBestTitle, { color: colors.success }]}>
                    🎉 NEW PERSONAL BEST FOR THIS TOPIC!
                  </Text>
                  <Text style={[styles.personalBestSub, { color: colors.textPrimary }]}>
                    Score upgraded to {newTopicPersonalRecord.currentScore} (previous: {newTopicPersonalRecord.previousBest})
                  </Text>
                </View>
              )}

              {/* Retry Growth Comparison Badge */}
              {retryComparison && retryComparison.scoreDelta !== 0 && !newTopicPersonalRecord && (
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
                    {retryComparison.scoreDelta} points compared to last session
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
              <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>CONFIDENCE DIMENSIONS (v2.0)</Text>
              <ScoreRow label="Fluency & Pacing (25%)" score={session.components?.speechFluencyScore ?? session.clarityScore} />
              <ScoreRow label="Topic Relevance (20%)" score={session.components?.topicRelevanceScore ?? session.toneScore} />
              <ScoreRow label="Pronunciation Clarity (15%)" score={(session.components as any)?.pronunciationScore ?? (session.localMetrics as any)?.nlp?.pronunciationScore ?? 85} />
              <ScoreRow label="Vocabulary Richness (15%)" score={session.components?.vocabularyScore ?? 0} />
              <ScoreRow label="Structure & Organization (15%)" score={session.components?.structureScore ?? 0} />
              <ScoreRow label="Practice Consistency (10%)" score={session.components?.practiceConsistencyScore ?? 0} />
            </GlassCard>

            {/* Speech Analytics Grid */}
            <GlassCard>
              <Text style={[styles.sectionLabel, { color: colors.accentCyan }]}>SPEECH & PRONUNCIATION METRICS</Text>
              <View style={styles.metricGrid}>
                <Metric label="Pace (WPM)" value={session.paceWPM} />
                <Metric label="Word count" value={session.wordCount ?? 0} />
                <Metric label="Filler words" value={`${session.fillerCount} (${session.fillerWords?.slice(0, 2).join(', ') || 'None'})`} />
                <Metric label="Pronunciation" value={`${(session.localMetrics as any)?.nlp?.pronunciationScore ?? 85}%`} />
                <Metric label="Articulation" value={`${(session.localMetrics as any)?.nlp?.articulationScore ?? 85}%`} />
                <Metric label="Pauses/min" value={session.pauseFrequency ?? 0} />
                <Metric label="Thinking pauses" value={(session.localMetrics as any)?.audio?.pauseBreakdown?.thinking ?? 0} />
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
              <PrimaryButton
                label="Practice Again 🔁"
                onPress={tryAgain}
                size="md"
                style={styles.retryButton}
              />
              <PrimaryButton
                label="Choose Topic 📋"
                onPress={() => setShowPracticeListModal(true)}
                variant="outline"
                size="md"
                style={styles.retryButton}
              />
            </View>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* Speaking Practice Topics Modal */}
      <SpeakingPracticeListModal
        visible={showPracticeListModal}
        onClose={() => setShowPracticeListModal(false)}
        onSelectPractice={handleSelectPracticeTopic}
        activePrompt={activePrompt}
        speechSessions={progress?.speechSessions}
      />

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

const getScoreBadgeColor = (score: number, colors: any) => {
  if (score >= 80) return colors.success;
  if (score >= 60) return colors.xpGold;
  return colors.danger;
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

const Metric = ({ label, value }: { label: string; value: string | number }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.metricCard, { backgroundColor: colors.bgInput, borderColor: colors.border }]}>
      <Text style={[styles.metricValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.metricLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

const ScoreRow = ({ label, score }: { label: string; score: number }) => {
  const { colors } = useTheme();
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));
  const barColor = clampedScore >= 80 ? colors.success : clampedScore >= 60 ? colors.xpGold : colors.danger;
  return (
    <View style={styles.scoreRow}>
      <View style={styles.scoreRowHeader}>
        <Text style={[styles.scoreRowLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.scoreRowValue, { color: barColor }]}>{clampedScore}</Text>
      </View>
      <View style={[styles.scoreBarTrack, { backgroundColor: colors.bgInput }]}>
        <View style={[styles.scoreBarFill, { width: `${clampedScore}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  headerTitleContainer: {
    flex: 1,
    paddingRight: 6,
  },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { ...(Typography.bodySmall as object) },
  topicsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicsBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scroll: { paddingHorizontal: Spacing.base, gap: Spacing.md, paddingBottom: 60 },
  promptHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  promptLabel: { ...(Typography.caption as object), letterSpacing: 1.5 },
  bestScorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  bestScoreText: {
    fontSize: 11,
    fontWeight: '700',
  },
  promptText: { fontSize: 16, fontWeight: '600', lineHeight: 24, marginVertical: 6 },
  languageHint: { ...(Typography.caption as object), lineHeight: 18, marginTop: 4 },
  promptActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionBtn: {
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  recordCard: { alignItems: 'center', gap: Spacing.base, paddingVertical: Spacing.xl },
  waveform: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 48 },
  waveBar: { width: 4, borderRadius: 2 },
  timer: { fontSize: 32, fontWeight: '800', letterSpacing: 2 },
  liveMetricsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    width: '100%',
  },
  liveMetricCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    alignItems: 'center',
    minWidth: 70,
  },
  liveMetricCompact: {
    minWidth: 95,
  },
  liveMetricValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  liveMetricLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  listeningHint: { fontSize: 13, fontWeight: '600' },
  liveTranscriptBox: {
    width: '100%',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    maxHeight: 120,
  },
  liveTranscriptLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  liveTranscript: { fontSize: 13, lineHeight: 18 },
  micBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  micHint: { ...(Typography.bodySmall as object) },
  errorText: { ...(Typography.bodySmall as object), textAlign: 'center', marginTop: 4 },
  processingCard: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.xs },
  processingText: { fontSize: 20, fontWeight: '800' },
  processingSub: { ...(Typography.bodySmall as object), textAlign: 'center', marginBottom: 12 },
  stageProgressList: { width: '100%', gap: 8, marginTop: 8 },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stageIcon: { fontSize: 14, width: 20 },
  stageTitle: { fontSize: 13 },
  scoreHero: { alignItems: 'center', gap: 4, paddingVertical: Spacing.lg },
  scoreNumber: { fontSize: 64, fontWeight: '900', lineHeight: 72 },
  scoreLabel: { fontSize: 14, fontWeight: '600' },
  personalBestBanner: {
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  personalBestTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  personalBestSub: {
    fontSize: 12,
    marginTop: 2,
  },
  retryBadge: {
    marginVertical: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  retryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  xpEarned: { fontSize: 15, fontWeight: '700', marginTop: 4 },
  languageBadge: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  sectionLabel: { ...(Typography.caption as object), letterSpacing: 1.5, marginBottom: 10 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  metricCard: {
    flex: 1,
    minWidth: '28%',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  metricValue: { fontSize: 14, fontWeight: '700' },
  metricLabel: { ...(Typography.caption as object), marginTop: 2, textAlign: 'center' },
  insightLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  fillerChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: BorderRadius.full, borderWidth: 1 },
  fillerText: { fontSize: 12, fontWeight: '600' },
  miniMission: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  coachMessage: { fontSize: 14, fontWeight: '600', lineHeight: 20, marginBottom: 8 },
  feedbackItem: { ...(Typography.bodySmall as object), lineHeight: 20, marginBottom: 4 },
  suggestionItem: { ...(Typography.bodySmall as object), lineHeight: 20, marginBottom: 4 },
  retryRow: { flexDirection: 'row', gap: Spacing.sm },
  retryButton: { flex: 1 },
  scoreRow: { gap: 4, marginBottom: 8 },
  scoreRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  scoreRowLabel: { fontSize: 13, fontWeight: '600' },
  scoreRowValue: { fontSize: 13, fontWeight: '800' },
  scoreBarTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 3 },
});
