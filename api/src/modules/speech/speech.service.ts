import { Injectable, Logger, NotFoundException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { PrismaService } from '../../prisma/prisma.service';

import { GamificationService } from '../gamification/gamification.service';

import { generateGeminiJson } from '../../common/utils/gemini.util';
import { getLevelInfo } from '../../common/utils/xp-engine.util';

import { CreateSpeechSessionDto } from './dto/create-speech-session.dto';

import { AnalyzeSpeechAiDto } from './dto/analyze-speech-ai.dto';

import { XpSource, ActivityEventType, Prisma } from '@prisma/client';



@Injectable()

export class SpeechService {

  private readonly logger = new Logger(SpeechService.name);

  constructor(

    private readonly prisma: PrismaService,

    private readonly gamificationService: GamificationService,

    private readonly configService: ConfigService,

  ) {}



  async createSession(userId: string, dto: CreateSpeechSessionDto) {

    const xpEarned =

      dto.xpEarned !== undefined

        ? Math.max(0, Math.round(dto.xpEarned))

        : this.calculateXp(dto.overallConfidenceScore);



    const session = await this.prisma.speechSession.create({

      data: {

        userId,

        transcript: dto.transcript,

        topic: dto.topic,

        languageDetected: dto.languageDetected,

        wordCount: dto.wordCount,

        sentenceCount: dto.sentenceCount ?? 0,

        fillerCount: dto.fillerCount,

        vocabularyRichness: dto.vocabularyRichness,

        repetitionScore: dto.repetitionScore ?? 0,

        averageVolume: dto.averageVolume,

        pauseFrequency: dto.pauseFrequency ?? 0,

        speechSpeedWpm: dto.speechSpeedWpm,

        fluencyScore: dto.fluencyScore,

        topicRelevanceScore: dto.topicRelevanceScore,

        overallConfidenceScore: dto.overallConfidenceScore,

        durationSeconds: dto.durationSeconds,

        xpEarned,

        languageMix: dto.languageMix as Prisma.InputJsonValue | undefined,

        confidenceComponents: dto.confidenceComponents as Prisma.InputJsonValue | undefined,

        localMetrics: dto.localMetrics as Prisma.InputJsonValue | undefined,

        aiInsights: dto.aiInsights as Prisma.InputJsonValue | undefined,

        fillerBreakdown: dto.fillerBreakdown as Prisma.InputJsonValue | undefined,

        coachingFeedback: dto.coachingFeedback ?? [],

        personalizedSuggestions: dto.personalizedSuggestions ?? [],

        miniMission: dto.miniMission,

        analysisMeta: dto.analysisMeta as Prisma.InputJsonValue | undefined,

        missionId: dto.missionId,

        challengeId: dto.challengeId,

      },

    });



    const confidenceAgg = await this.prisma.speechSession.aggregate({

      where: { userId },

      _avg: { overallConfidenceScore: true },

    });



    await this.prisma.user.update({

      where: { id: userId },

      data: {

        confidenceScore:

          Math.round((confidenceAgg._avg.overallConfidenceScore ?? 0) * 100) / 100,

      },

    });



    const gamification = await this.gamificationService.awardXp(
      userId,
      xpEarned,
      XpSource.SPEECH_SESSION,
      session.id,
    );

    let newBadges: Array<{
      id: string;
      name: string;
      description: string;
      icon: string;
      tier: string;
    }> = [];

    if (gamification.newBadges.length > 0) {
      const badges = await this.prisma.badge.findMany({
        where: { name: { in: gamification.newBadges }, isActive: true },
      });
      newBadges = badges.map((badge) => ({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        tier: badge.tier,
      }));
    }

    await this.prisma.activityTimeline.create({

      data: {

        userId,

        eventType: ActivityEventType.SPEECH_SESSION,

        eventData: {

          sessionId: session.id,

          overallConfidenceScore: dto.overallConfidenceScore,

          xpEarned,

        },

      },

    });



    return {
      ...session,
      xpEarned,
      gamification: {
        newXp: gamification.newXp,
        newLevel: gamification.newLevel,
        leveledUp: gamification.leveledUp,
        levelTitle: getLevelInfo(gamification.newLevel).title,
        newBadges,
      },
    };

  }



  async analyzeWithAi(userId: string, dto: AnalyzeSpeechAiDto) {

    const fallback = this.buildFallbackAiAnalysis(dto);

    const apiKey = this.configService.get<string>('gemini.apiKey')?.trim();

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY is not set — speech analysis using local fallback');
      return fallback;
    }

    try {

      const preferredModel =
        this.configService.get<string>('gemini.model') ?? 'gemini-2.0-flash';

      const { parsed, model } = await generateGeminiJson({
        apiKey,
        model: preferredModel,
        prompt: this.buildGeminiPrompt(userId, dto),
        temperature: 0.35,
      });

      return {

        topicRelevanceScore: this.clampScore(parsed.topicRelevanceScore, fallback.topicRelevanceScore),

        coachingFeedback: this.stringArray(parsed.coachingFeedback, fallback.coachingFeedback),

        personalizedSuggestions: this.stringArray(

          parsed.personalizedSuggestions,

          fallback.personalizedSuggestions,

        ),

        personalizedExercises: this.stringArray(

          parsed.personalizedExercises,

          fallback.personalizedExercises,

        ),

        strengths: this.stringArray(parsed.strengths, fallback.strengths),

        weaknesses: this.stringArray(parsed.weaknesses, fallback.weaknesses),

        coachMessage:

          typeof parsed.coachMessage === 'string' && parsed.coachMessage.trim()

            ? parsed.coachMessage.trim()

            : fallback.coachMessage,

        topicCoverage: this.topicCoverage(parsed.topicCoverage, fallback.topicCoverage),

        depthScore: this.depthScore(parsed.depthScore, fallback.depthScore),

        codeSwitchingQuality: this.clampScore(

          parsed.codeSwitchingQuality,

          fallback.codeSwitchingQuality ?? 70,

        ),

        emotionalTone:

          typeof parsed.emotionalTone === 'string' && parsed.emotionalTone.trim()

            ? parsed.emotionalTone.trim()

            : fallback.emotionalTone,

        miniMission:

          typeof parsed.miniMission === 'string' && parsed.miniMission.trim()

            ? parsed.miniMission.trim()

            : fallback.miniMission,

        languageFallback:

          parsed.languageFallback && typeof parsed.languageFallback === 'object'

            ? parsed.languageFallback

            : undefined,

        analysisMeta: {

          provider: 'gemini',

          model,

        },

      };

    } catch (error) {

      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Gemini speech analysis failed: ${message}`);
      return fallback;

    }

  }



  async findUserSessions(userId: string, page: number, limit: number) {

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([

      this.prisma.speechSession.findMany({

        where: { userId },

        orderBy: { createdAt: 'desc' },

        skip,

        take: limit,

      }),

      this.prisma.speechSession.count({ where: { userId } }),

    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };

  }



  async findOne(id: string, userId: string) {

    const session = await this.prisma.speechSession.findUnique({ where: { id } });

    if (!session || session.userId !== userId) {

      throw new NotFoundException('Speech session not found');

    }

    return session;

  }



  async findAllSessions(page: number, limit: number) {

    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([

      this.prisma.speechSession.findMany({

        orderBy: { createdAt: 'desc' },

        skip,

        take: limit,

        include: { user: { select: { id: true, name: true, email: true } } },

      }),

      this.prisma.speechSession.count(),

    ]);

    return { items, total, page, limit, pages: Math.ceil(total / limit) };

  }



  private calculateXp(score: number) {

    return score >= 80 ? 70 : score >= 65 ? 50 : score >= 50 ? 30 : 15;

  }



  private buildGeminiPrompt(userId: string, dto: AnalyzeSpeechAiDto) {

    const payload = dto.structuredPayload ?? {

      topic: dto.topic,

      transcript: dto.transcript,

      nlp: dto.nlpSummary,

      audio: dto.audioSummary,

      language: dto.languageSummary,

    };



    return [

      'You are Atlas, the ConfidenceUp speaking coach.',

      'Return strict JSON only. Do not include markdown.',

      'The app computes the final confidence score locally. You provide semantic coaching only.',

      `User ID: ${userId}`,

      `Structured local metrics: ${JSON.stringify(payload)}`,

      `Transcript: ${dto.transcript}`,

      'JSON shape:',

      '{"topicRelevanceScore":0,"topicCoverage":{"percent":0,"missing":[""]},"depthScore":0,"codeSwitchingQuality":0,"emotionalTone":"","strengths":[""],"weaknesses":[""],"coachMessage":"","coachingFeedback":[""],"personalizedSuggestions":[""],"personalizedExercises":[""],"miniMission":""}',

    ].join('\n');

  }



  private buildFallbackAiAnalysis(dto: AnalyzeSpeechAiDto) {

    const words = dto.transcript.toLowerCase().split(/\s+/).filter(Boolean);

    const topicWords = dto.topic.toLowerCase().split(/\s+/).filter((word) => word.length > 3);

    const matched = topicWords.filter((word) => words.some((spoken) => spoken.includes(word)));

    const relevance = topicWords.length

      ? Math.round((matched.length / topicWords.length) * 100)

      : 70;

    const topicRelevanceScore = Math.max(45, Math.min(90, relevance || 55));

    const nlp = (dto.nlpSummary ?? {}) as Record<string, unknown>;

    const hedgingCount = Number(nlp.hedgingCount ?? 0);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (topicRelevanceScore >= 70) strengths.push('Stayed close to the prompt topic.');
    if (hedgingCount > 3) weaknesses.push('Use more direct language instead of hedging.');

    if (topicRelevanceScore < 65) weaknesses.push('Connect your answer more directly to the prompt.');



    return {

      topicRelevanceScore,

      coachingFeedback: [

        topicRelevanceScore >= 70

          ? 'You stayed close to the prompt. Add one concrete example to make it stronger.'

          : 'Your answer drifted from the topic. Mention the prompt directly in your first sentence.',

        'Keep your next attempt focused on one clear point, then support it with a short example.',

      ],

      personalizedSuggestions: [

        'Open with the main idea in one sentence.',

        'Use a brief pause before your next key point.',

      ],

      personalizedExercises: [

        'Record a 30-second answer using two transition words.',

        'Re-record and add one concrete example.',

      ],

      strengths: strengths.length ? strengths : ['You completed a practice session.'],

      weaknesses,

      coachMessage:

        topicRelevanceScore >= 70

          ? 'Solid effort on topic relevance. Add one specific example to make your next answer memorable.'

          : 'Lead with a direct answer to the prompt, then support it with a short example.',

      topicCoverage: {

        percent: topicRelevanceScore,

        missing: topicRelevanceScore < 70 ? ['More direct mention of the prompt'] : [],

      },

      depthScore: 6.5,

      codeSwitchingQuality: 70,

      emotionalTone: 'Neutral',

      miniMission:

        topicRelevanceScore >= 70

          ? 'Try again and add one specific detail.'

          : 'Try again and mention two keywords from the prompt.',

      analysisMeta: { provider: 'local-fallback' },

    };

  }



  private parseJsonObject(text: string): Record<string, any> {

    try {

      return JSON.parse(text);

    } catch {

      const match = text.match(/\{[\s\S]*\}/);

      if (!match) return {};

      try {

        return JSON.parse(match[0]);

      } catch {

        return {};

      }

    }

  }



  private clampScore(value: unknown, fallback: number) {

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) return fallback;

    return Math.max(0, Math.min(100, Math.round(numeric)));

  }



  private depthScore(value: unknown, fallback: number) {

    const numeric = Number(value);

    if (!Number.isFinite(numeric)) return fallback;

    return Math.max(0, Math.min(10, Math.round(numeric * 10) / 10));

  }



  private topicCoverage(value: unknown, fallback: { percent: number; missing: string[] }) {

    if (!value || typeof value !== 'object') return fallback;

    const coverage = value as Record<string, unknown>;

    return {

      percent: this.clampScore(coverage.percent, fallback.percent),

      missing: Array.isArray(coverage.missing)

        ? coverage.missing.map(String).filter((item) => item.trim()).slice(0, 5)

        : fallback.missing,

    };

  }



  private stringArray(value: unknown, fallback: string[]) {

    return Array.isArray(value)

      ? value.map(String).filter((item) => item.trim()).slice(0, 5)

      : fallback;

  }

}


