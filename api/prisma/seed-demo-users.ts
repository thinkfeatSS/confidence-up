import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import {
  PrismaClient,
  Role,
  Platform,
  DocumentType,
  NotificationType,
  ActivityEventType,
  XpSource,
  TicketStatus,
} from '@prisma/client';
import { generateReferralCode } from '../src/common/utils/otp.util';

const prisma = new PrismaClient();

const ADMIN = {
  email: 'admin@binaryunit.tech',
  name: 'SpeakUpMic Admin',
  password: 'Admin@12345',
};

const DEMO = {
  email: 'demo@speakupmic.com',
  name: 'Alex Demo',
  password: 'Demo@12345',
};

async function removeUserByEmail(email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log(`  Removed existing user: ${email}`);
  }
}

async function seedAdmin(passwordHash: string) {
  const user = await prisma.user.create({
    data: {
      email: ADMIN.email,
      name: ADMIN.name,
      passwordHash,
      role: Role.ADMIN,
      isVerified: true,
      onboardingCompleted: true,
      referralCode: generateReferralCode(),
      streak: { create: {} },
      settings: {
        create: {
          dailyReminders: true,
          soundEffects: true,
          darkMode: true,
          weeklyReportEmail: true,
        },
      },
      termsAcceptances: {
        create: [
          { documentType: DocumentType.TERMS, version: '1.0' },
          { documentType: DocumentType.PRIVACY, version: '1.0' },
        ],
      },
    },
  });

  console.log(`✅ Admin: ${ADMIN.email} (password: ${ADMIN.password})`);
  return user;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d;
}

function dateOnly(daysBack: number) {
  const d = daysAgo(daysBack);
  return new Date(d.toISOString().split('T')[0]);
}

async function seedDemoUser(passwordHash: string) {
  const [missions, challenges, badges, fearLevels, skillNodes] = await Promise.all([
    prisma.mission.findMany({ where: { isActive: true }, take: 6, orderBy: { createdAt: 'asc' } }),
    prisma.challenge.findMany({ where: { isActive: true }, take: 4, orderBy: { createdAt: 'asc' } }),
    prisma.badge.findMany({ where: { isActive: true }, take: 6, orderBy: { createdAt: 'asc' } }),
    prisma.fearLevel.findMany({ take: 5, orderBy: [{ categoryId: 'asc' }, { levelNumber: 'asc' }] }),
    prisma.skillNode.findMany({ where: { tier: { lte: 3 } }, orderBy: { tier: 'asc' } }),
  ]);

  const xpTotal = 520;
  const demo = await prisma.user.create({
    data: {
      email: DEMO.email,
      name: DEMO.name,
      passwordHash,
      role: Role.USER,
      isVerified: true,
      onboardingCompleted: true,
      onboardingFears: ['Public speaking', 'Social anxiety'],
      onboardingGoals: ['Job interviews', 'Speak with confidence daily'],
      onboardingDailyTime: '15 min',
      preferredLanguages: ['English'],
      xpTotal,
      level: 4,
      confidenceScore: 74,
      referralCode: generateReferralCode(),
      streak: {
        create: {
          currentStreak: 7,
          longestStreak: 12,
          lastCheckinDate: dateOnly(0),
        },
      },
      settings: {
        create: {
          dailyReminders: true,
          soundEffects: true,
          darkMode: true,
          weeklyReportEmail: true,
        },
      },
      devices: {
        create: {
          platform: Platform.ANDROID,
          deviceName: 'Demo Pixel',
          appVersion: '1.0.0',
          isActive: true,
        },
      },
      termsAcceptances: {
        create: [
          { documentType: DocumentType.TERMS, version: '1.0' },
          { documentType: DocumentType.PRIVACY, version: '1.0' },
        ],
      },
    },
  });

  // Daily check-ins (last 7 days)
  for (let i = 0; i < 7; i += 1) {
    await prisma.dailyCheckin.create({
      data: { userId: demo.id, date: dateOnly(i), xpEarned: 10 },
    });
  }

  // Missions — 4 completed, 1 bookmarked in progress
  for (let i = 0; i < missions.length; i += 1) {
    const mission = missions[i];
    await prisma.userMission.create({
      data: {
        userId: demo.id,
        missionId: mission.id,
        completedAt: i < 4 ? daysAgo(6 - i) : null,
        isBookmarked: i === 4,
      },
    });
  }

  // Challenges — 2 completed, 1 active
  for (let i = 0; i < challenges.length; i += 1) {
    const challenge = challenges[i];
    const completed = i < 2;
    await prisma.userChallenge.create({
      data: {
        userId: demo.id,
        challengeId: challenge.id,
        startedAt: daysAgo(completed ? 14 - i * 3 : 2),
        completedAt: completed ? daysAgo(7 - i * 2) : null,
        isBookmarked: i === 2,
      },
    });
  }

  // Fear ladder progress
  for (const level of fearLevels) {
    await prisma.userFearProgress.create({
      data: { userId: demo.id, fearLevelId: level.id, completedAt: daysAgo(10 - level.levelNumber) },
    });
  }

  // Skill tree — tier 1–3 nodes
  for (const node of skillNodes) {
    await prisma.userSkillNode.create({
      data: { userId: demo.id, skillNodeId: node.id, unlockedAt: daysAgo(20 - node.tier * 2) },
    });
  }

  // Badges
  for (const badge of badges) {
    await prisma.userBadge.create({
      data: { userId: demo.id, badgeId: badge.id, earnedAt: daysAgo(8) },
    });
  }

  // XP history
  const xpEvents: { amount: number; source: XpSource; daysAgo: number }[] = [
    { amount: 50, source: XpSource.MISSION, daysAgo: 6 },
    { amount: 50, source: XpSource.MISSION, daysAgo: 5 },
    { amount: 100, source: XpSource.CHALLENGE, daysAgo: 4 },
    { amount: 10, source: XpSource.DAILY_CHECKIN, daysAgo: 3 },
    { amount: 75, source: XpSource.SPEECH_SESSION, daysAgo: 2 },
    { amount: 40, source: XpSource.FEAR_LEVEL, daysAgo: 1 },
    { amount: 30, source: XpSource.BADGE, daysAgo: 1 },
  ];
  for (const evt of xpEvents) {
    await prisma.xpTransaction.create({
      data: {
        userId: demo.id,
        amount: evt.amount,
        source: evt.source,
        createdAt: daysAgo(evt.daysAgo),
      },
    });
  }

  // Speech sessions
  const speechSamples = [
    {
      topic: 'Introducing myself at a team meeting',
      transcript:
        'Good morning everyone. My name is Alex and I joined the product team last month. I am excited to collaborate on our confidence app roadmap. Today I want to share three goals for this sprint.',
      overallConfidenceScore: 72,
      fluencyScore: 70,
      speechSpeedWpm: 128,
      fillerCount: 3,
      durationSeconds: 68,
      daysAgo: 1,
      missionIdx: 0,
    },
    {
      topic: 'Answering "Tell me about yourself"',
      transcript:
        'I am a motivated professional who enjoys solving communication challenges. In my last role I led weekly standups and mentored two junior teammates. I am looking for opportunities to grow my public speaking skills.',
      overallConfidenceScore: 78,
      fluencyScore: 76,
      speechSpeedWpm: 135,
      fillerCount: 2,
      durationSeconds: 82,
      daysAgo: 3,
      missionIdx: 1,
    },
    {
      topic: 'Explaining a project update',
      transcript:
        'This week we shipped the daily mission feature and improved streak reminders. User retention increased because people return for their daily challenge. Next we will focus on speech feedback quality.',
      overallConfidenceScore: 81,
      fluencyScore: 79,
      speechSpeedWpm: 142,
      fillerCount: 1,
      durationSeconds: 74,
      daysAgo: 5,
      challengeIdx: 0,
    },
    {
      topic: 'Practice elevator pitch',
      transcript:
        'SpeakUpMic helps people build real-world speaking confidence through daily missions, fear ladders, and AI coaching. We turn practice into measurable progress with streaks, XP, and personalized feedback.',
      overallConfidenceScore: 69,
      fluencyScore: 67,
      speechSpeedWpm: 118,
      fillerCount: 4,
      durationSeconds: 55,
      daysAgo: 7,
      missionIdx: 2,
    },
    {
      topic: 'Handling nervousness before a call',
      transcript:
        'Before important calls I take three deep breaths, review my key points, and remind myself that preparation beats perfection. I have done this many times and each call gets a little easier.',
      overallConfidenceScore: 75,
      fluencyScore: 73,
      speechSpeedWpm: 130,
      fillerCount: 2,
      durationSeconds: 61,
      daysAgo: 9,
      missionIdx: 3,
    },
  ];

  for (const sample of speechSamples) {
    const words = sample.transcript.split(/\s+/).filter(Boolean);
    await prisma.speechSession.create({
      data: {
        userId: demo.id,
        topic: sample.topic,
        transcript: sample.transcript,
        languageDetected: 'en',
        wordCount: words.length,
        sentenceCount: sample.transcript.split(/[.!?]+/).filter(Boolean).length,
        fillerCount: sample.fillerCount,
        vocabularyRichness: 0.62,
        repetitionScore: 0.18,
        averageVolume: 68,
        pauseFrequency: 0.22,
        speechSpeedWpm: sample.speechSpeedWpm,
        fluencyScore: sample.fluencyScore,
        topicRelevanceScore: 82,
        overallConfidenceScore: sample.overallConfidenceScore,
        durationSeconds: sample.durationSeconds,
        xpEarned: 25,
        missionId: sample.missionIdx != null ? missions[sample.missionIdx]?.id : undefined,
        challengeId: sample.challengeIdx != null ? challenges[sample.challengeIdx]?.id : undefined,
        confidenceComponents: {
          speechFluencyScore: sample.fluencyScore,
          vocabularyScore: 71,
          structureScore: 74,
          topicRelevanceScore: 82,
          energyScore: 70,
          practiceConsistencyScore: 76,
        },
        coachingFeedback: {
          strengths: ['Clear structure', 'Good pace'],
          improvements: ['Reduce filler words', 'End with a stronger call to action'],
        },
        personalizedSuggestions: ['Practice the opening 10 seconds', 'Record again tomorrow morning'],
        createdAt: daysAgo(sample.daysAgo),
      },
    });
  }

  // Journal entries
  const journals = [
    {
      title: 'First week reflection',
      body: 'I noticed my anxiety drops when I practice for just five minutes before meetings. Small wins matter.',
      mood: 4,
      daysAgo: 2,
    },
    {
      title: 'Interview prep',
      body: 'Practiced my "tell me about yourself" answer three times. Feeling more natural each round.',
      mood: 4,
      daysAgo: 4,
    },
    {
      title: 'Streak motivation',
      body: 'Seven days in a row! The daily mission keeps me accountable even on busy days.',
      mood: 5,
      daysAgo: 0,
    },
  ];
  for (const entry of journals) {
    await prisma.journalEntry.create({
      data: {
        userId: demo.id,
        title: entry.title,
        body: entry.body,
        mood: entry.mood,
        reflectionPrompt: 'What felt easier today than last week?',
        createdAt: daysAgo(entry.daysAgo),
      },
    });
  }

  // Notifications
  const notifications = [
    { title: 'Badge earned: First Speech', body: 'You recorded your first practice session!', type: NotificationType.BADGE_EARNED },
    { title: '7-day streak!', body: 'Keep it going — consistency builds confidence.', type: NotificationType.STREAK_REMINDER },
    { title: "Today's mission", body: 'Your daily mission is ready. Tap to start.', type: NotificationType.MISSION_REMINDER },
  ];
  for (let i = 0; i < notifications.length; i += 1) {
    const n = notifications[i];
    await prisma.notification.create({
      data: {
        userId: demo.id,
        title: n.title,
        body: n.body,
        type: n.type,
        isRead: i > 0,
        sentAt: daysAgo(2 - i),
      },
    });
  }

  // Activity timeline
  const activities: { eventType: ActivityEventType; eventData: object; daysAgo: number }[] = [
    { eventType: ActivityEventType.MISSION_COMPLETED, eventData: { missionTitle: missions[0]?.title ?? 'Daily mission' }, daysAgo: 6 },
    { eventType: ActivityEventType.CHALLENGE_COMPLETED, eventData: { challengeTitle: challenges[0]?.title ?? 'Challenge' }, daysAgo: 5 },
    { eventType: ActivityEventType.BADGE_EARNED, eventData: { badgeName: badges[0]?.name ?? 'First Step' }, daysAgo: 4 },
    { eventType: ActivityEventType.SPEECH_SESSION, eventData: { score: 78 }, daysAgo: 3 },
    { eventType: ActivityEventType.STREAK_MILESTONE, eventData: { streak: 7 }, daysAgo: 0 },
    { eventType: ActivityEventType.FEAR_LEVEL_COMPLETED, eventData: { level: 1 }, daysAgo: 8 },
  ];
  for (const act of activities) {
    await prisma.activityTimeline.create({
      data: {
        userId: demo.id,
        eventType: act.eventType,
        eventData: act.eventData,
        createdAt: daysAgo(act.daysAgo),
      },
    });
  }

  // Support ticket (resolved)
  await prisma.supportTicket.create({
    data: {
      userId: demo.id,
      subject: 'How do I reset my daily streak?',
      body: 'I missed a day while traveling. Can my streak be restored?',
      status: TicketStatus.RESOLVED,
      adminResponse: 'Streaks reflect daily practice — keep going and you will beat your longest streak soon!',
      createdAt: daysAgo(12),
    },
  });

  // Feedback
  await prisma.userFeedback.create({
    data: {
      userId: demo.id,
      rating: 5,
      comment: 'Love the daily missions and speech feedback!',
      featureArea: 'speaking-practice',
    },
  });

  console.log(`✅ Demo user: ${DEMO.email} (password: ${DEMO.password})`);
  console.log(`   XP: ${xpTotal} | Level: 4 | Confidence: 74 | Streak: 7`);
  console.log(`   ${speechSamples.length} speech sessions, ${journals.length} journal entries`);
  return demo;
}

async function main() {
  console.log('🌱 Seeding admin & demo users...\n');

  const passwordHashAdmin = await bcrypt.hash(ADMIN.password, 12);
  const passwordHashDemo = await bcrypt.hash(DEMO.password, 12);

  await removeUserByEmail(ADMIN.email);
  await removeUserByEmail(DEMO.email);

  await seedAdmin(passwordHashAdmin);
  await seedDemoUser(passwordHashDemo);

  console.log('\n🎉 Demo users seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
