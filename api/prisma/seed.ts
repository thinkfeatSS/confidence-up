import 'dotenv/config';
import {
  PrismaClient,
  BadgeTier,
  Difficulty,
  AnnouncementType,
  Platform,
  Mission,
} from '@prisma/client';

const prisma = new PrismaClient();

function mapDifficulty(d: string): Difficulty {
  const map: Record<string, Difficulty> = {
    easy: Difficulty.EASY,
    medium: Difficulty.MEDIUM,
    hard: Difficulty.HARD,
  };
  return map[d.toLowerCase()] ?? Difficulty.EASY;
}

function mapTier(t: string): BadgeTier {
  const map: Record<string, BadgeTier> = {
    beginner: BadgeTier.BEGINNER,
    growth: BadgeTier.GROWTH,
    advanced: BadgeTier.ADVANCED,
    special: BadgeTier.SPECIAL,
  };
  return map[t.toLowerCase()] ?? BadgeTier.BEGINNER;
}

function withWhyItHelps(description: string, whyItHelps?: string): string {
  if (!whyItHelps) return description;
  return `${description}\n\nWhy it helps: ${whyItHelps}`;
}

function withTips(description: string, tips: string[]): string {
  if (!tips.length) return description;
  return `${description}\n\nTips:\n${tips.map((t) => `• ${t}`).join('\n')}`;
}

async function clearContent() {
  await prisma.dailyMission.deleteMany();
  await prisma.userMission.deleteMany();
  await prisma.userChallenge.deleteMany();
  await prisma.userFearProgress.deleteMany();
  await prisma.userSkillNode.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.fearLevel.deleteMany();
  await prisma.fearCategory.deleteMany();
  await prisma.mission.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.userSkillNode.deleteMany();
  await prisma.skillNode.updateMany({ data: { parentNodeId: null } });
  await prisma.skillNode.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.appVersion.deleteMany();
}

async function seedBadges() {
  const badges = [
    // BEGINNER
    { name: 'First Step', description: 'Complete your very first challenge', icon: '🌱', tier: 'beginner', category: 'milestones', criteria: { type: 'challenges_completed', value: 1 }, xpReward: 25 },
    { name: 'First Speech', description: 'Record your first practice speech', icon: '🎤', tier: 'beginner', category: 'speaking', criteria: { type: 'speech_sessions', value: 1 }, xpReward: 30 },
    { name: 'Streak Starter', description: 'Complete challenges 3 days in a row', icon: '🔥', tier: 'beginner', category: 'streak', criteria: { type: 'streak_milestone', value: 3 }, xpReward: 40 },
    { name: 'Journal Keeper', description: 'Write your first journal entry', icon: '📔', tier: 'beginner', category: 'journal', criteria: { type: 'journal_entries', value: 1 }, xpReward: 25 },
    { name: 'Fear Facer', description: 'Complete your first fear exposure level', icon: '😤', tier: 'beginner', category: 'fear', criteria: { type: 'fear_levels_completed', value: 1 }, xpReward: 35 },
    { name: 'Curious Mind', description: 'Chat with Atlas, your AI coach', icon: '🤖', tier: 'beginner', category: 'coach', criteria: { type: 'coach_sessions', value: 1 }, xpReward: 20 },
    { name: 'Daily Warrior', description: 'Complete your first daily mission', icon: '☀️', tier: 'beginner', category: 'missions', criteria: { type: 'missions_completed', value: 1 }, xpReward: 30 },

    // GROWTH
    { name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚔️', tier: 'growth', category: 'streak', criteria: { type: 'streak_milestone', value: 7 }, xpReward: 75 },
    { name: 'Speech Collector', description: 'Complete 10 speech sessions', icon: '📊', tier: 'growth', category: 'speaking', criteria: { type: 'speech_sessions', value: 10 }, xpReward: 80 },
    { name: 'Challenge Crusher', description: 'Complete 20 challenges', icon: '💪', tier: 'growth', category: 'challenges', criteria: { type: 'challenges_completed', value: 20 }, xpReward: 100 },
    { name: 'Social Butterfly', description: 'Complete 5 social challenges', icon: '🦋', tier: 'growth', category: 'social', criteria: { type: 'social_challenges', value: 5 }, xpReward: 70 },
    { name: 'Fear Climber', description: 'Reach Level 5 in any fear category', icon: '🧗', tier: 'growth', category: 'fear', criteria: { type: 'fear_level_reached', value: 5 }, xpReward: 90 },
    { name: 'Score Riser', description: 'Reach a confidence score of 70+', icon: '📈', tier: 'growth', category: 'confidence', criteria: { type: 'confidence_score', value: 70 }, xpReward: 85 },
    { name: 'Knowledge Sharer', description: 'Complete 3 academic challenges', icon: '🎓', tier: 'growth', category: 'academic', criteria: { type: 'academic_challenges', value: 3 }, xpReward: 65 },
    { name: 'Reflector', description: 'Write 7 journal entries', icon: '🌟', tier: 'growth', category: 'journal', criteria: { type: 'journal_entries', value: 7 }, xpReward: 60 },
    { name: 'XP Hunter', description: 'Earn 500 total XP', icon: '⭐', tier: 'growth', category: 'xp', criteria: { type: 'xp_milestone', value: 500 }, xpReward: 50 },

    // ADVANCED
    { name: 'No Filler Master', description: 'Complete a speech with 0 filler words', icon: '🏆', tier: 'advanced', category: 'speaking', criteria: { type: 'zero_filler_speech', value: 1 }, xpReward: 120 },
    { name: '30-Day Streak', description: 'Maintain a streak for 30 consecutive days', icon: '🌋', tier: 'advanced', category: 'streak', criteria: { type: 'streak_milestone', value: 30 }, xpReward: 200 },
    { name: 'Fear Conqueror', description: 'Complete all levels of any fear category', icon: '🦁', tier: 'advanced', category: 'fear', criteria: { type: 'fear_category_complete', value: 1 }, xpReward: 250 },
    { name: 'Skill Unlocked', description: 'Unlock your first skill tree node', icon: '🌳', tier: 'advanced', category: 'skill', criteria: { type: 'skill_nodes_unlocked', value: 1 }, xpReward: 75 },
    { name: 'Confidence Booster', description: 'Reach a confidence score of 90+', icon: '🚀', tier: 'advanced', category: 'confidence', criteria: { type: 'confidence_score', value: 90 }, xpReward: 150 },
    { name: 'Top Communicator', description: 'Complete 50 challenges total', icon: '👑', tier: 'advanced', category: 'challenges', criteria: { type: 'challenges_completed', value: 50 }, xpReward: 180 },
    { name: 'Speech Ace', description: 'Score 90+ on 3 consecutive speeches', icon: '🎯', tier: 'advanced', category: 'speaking', criteria: { type: 'high_score_streak', value: 3 }, xpReward: 140 },

    // SPECIAL
    { name: 'Level 10 Reached', description: 'Reach Level 10 in the confidence RPG', icon: '💎', tier: 'special', category: 'level', criteria: { type: 'user_level', value: 10 }, xpReward: 300 },
    { name: 'Consistent Champion', description: 'Complete challenges every day for 7 weeks', icon: '✨', tier: 'special', category: 'streak', criteria: { type: 'streak_milestone', value: 49 }, xpReward: 350 },
    { name: 'AI Partner', description: 'Have 20 coaching sessions with Atlas', icon: '🌐', tier: 'special', category: 'coach', criteria: { type: 'coach_sessions', value: 20 }, xpReward: 200 },
    { name: 'Transformation', description: 'Improve your confidence score by 30+ points', icon: '🦅', tier: 'special', category: 'confidence', criteria: { type: 'confidence_improvement', value: 30 }, xpReward: 400 },
    { name: '100-Day Legend', description: 'Maintain a 100-day streak', icon: '🏅', tier: 'special', category: 'streak', criteria: { type: 'streak_milestone', value: 100 }, xpReward: 500 },
  ];

  for (const b of badges) {
    await prisma.badge.create({
      data: {
        name: b.name,
        description: b.description,
        icon: b.icon,
        tier: mapTier(b.tier),
        category: b.category,
        criteria: b.criteria,
        xpReward: b.xpReward,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${badges.length} badges`);
}

async function seedFearCategories() {
  const categories = [
    {
      name: 'Public Speaking',
      description: 'Gradually face the fear of speaking in front of others — from alone to the stage.',
      icon: '🎤',
      color: '#06B6D4',
      orderIndex: 0,
      levels: [
        { level: 1, title: 'Speak Alone', description: 'Stand in your room and speak for 2 minutes on any topic. No audience.', tips: ['Close your eyes if it helps', 'Just get used to your own voice', 'Record it for yourself only'], xpReward: 30 },
        { level: 2, title: 'Speak to a Trusted Friend', description: 'Have a 5-minute conversation with your closest friend about a topic you prepared.', tips: ['Choose someone who supports you', 'It does not need to be perfect', 'Focus on delivery, not content'], xpReward: 40 },
        { level: 3, title: 'Small Group of 3', description: 'Share a 2-minute story or opinion with 3 friends or family members.', tips: ['Pick people who are kind listeners', 'Make eye contact with each person', 'Pause for effect — do not rush'], xpReward: 55 },
        { level: 4, title: 'Record a Video', description: 'Record a 2-minute video on your phone speaking about any topic. Watch it back once.', tips: ['First watch — only look for positives', 'Second watch — identify one thing to improve', 'You will cringe — everyone does. Push through'], xpReward: 65 },
        { level: 5, title: 'Present to a Small Class', description: 'Give a 3-minute presentation in front of 5–10 people in a classroom setting.', tips: ['Start with a hook — a question or bold statement', 'Move slowly and deliberately', 'Breathe between slides or points'], xpReward: 80 },
        { level: 6, title: 'Q&A Session', description: 'After a presentation, invite and answer questions from the audience for 5 minutes.', tips: ['Listen fully before answering', '"Great question" buys you thinking time', 'It is okay to say "I will find out"'], xpReward: 90 },
        { level: 7, title: 'Formal Presentation', description: 'Give a structured 5-minute formal presentation with slides to a class or group.', tips: ['Rehearse with a timer', 'Practice transitions between slides', 'Make your opening memorable'], xpReward: 100 },
        { level: 8, title: 'Debate Participation', description: 'Participate in a structured debate, arguing a position in front of an audience.', tips: ['Know your strongest 2-3 arguments cold', 'Counter-arguments make you stronger', 'Stay calm when challenged'], xpReward: 120 },
        { level: 9, title: 'Workshop Facilitation', description: 'Lead a 15-minute workshop or discussion session for a group of 10+ people.', tips: ['Ask questions to keep people engaged', 'Manage time visually (write on board)', 'Energy is contagious — bring yours'], xpReward: 150 },
        { level: 10, title: 'Stage Speech', description: 'Deliver a prepared 5-minute speech from a stage or elevated platform to 20+ people.', tips: ['Own the stage — move purposefully', 'Make someone in the back feel included', 'End with a memorable call to action'], xpReward: 200 },
      ],
    },
    {
      name: 'Job Interviews',
      description: 'Build interview confidence step by step — from self-practice to real conversations.',
      icon: '💼',
      color: '#A855F7',
      orderIndex: 1,
      levels: [
        { level: 1, title: 'Self-Interview Alone', description: 'Ask yourself common interview questions out loud and answer them in full sentences.', tips: ['Use STAR method: Situation, Task, Action, Result', 'Record your answers', 'Time each answer (aim for 90 seconds)'], xpReward: 30 },
        { level: 2, title: 'Mock Interview with a Friend', description: 'Ask a friend to interview you using 5 standard questions. Get honest feedback.', tips: ['Dress appropriately even for mock interviews', 'Ask for honest feedback after', 'Practice your handshake / greeting'], xpReward: 45 },
        { level: 3, title: 'Research a Company and Present', description: 'Research a company you want to work for and give a 3-minute verbal summary.', tips: ['Look at their mission, products, recent news', '"Why this company?" is almost always asked', 'Show genuine interest, not memorized facts'], xpReward: 55 },
        { level: 4, title: 'Record Video Mock Interview', description: 'Set up your camera and do a full 15-minute mock interview answering 10 questions on video.', tips: ['Watch it back focusing on filler words', 'Notice your body language', 'Improve one thing per attempt'], xpReward: 70 },
        { level: 5, title: 'Real Informational Interview', description: 'Reach out to a professional in your field and request a 15-minute informational interview.', tips: ['Send a professional email request', 'Come with prepared questions', 'Send a thank-you message after'], xpReward: 100 },
      ],
    },
    {
      name: 'English Speaking',
      description: 'Grow fluency and comfort speaking English — especially for Urdu-English mixed learners.',
      icon: '🗣️',
      color: '#10B981',
      orderIndex: 2,
      levels: [
        { level: 1, title: 'Think in English for 10 Min', description: 'Narrate your actions mentally in English for 10 continuous minutes.', tips: ['Narrate what you are doing: "I am walking to..."', 'No pressure to be grammatically perfect', 'This builds automatic language retrieval'], xpReward: 25 },
        { level: 2, title: 'Speak English to Yourself Daily', description: 'Have a 5-minute self-talk session in English about your day every evening.', tips: ['Talk about what happened, what you felt, what you learned', 'No script — go natural', 'Consistency beats perfection'], xpReward: 35 },
        { level: 3, title: 'Watch English Without Subtitles', description: 'Watch 20 minutes of English video content with no subtitles and summarize what you watched.', tips: ['Start with slower speakers', 'Pause and repeat if needed', 'The summary exercise forces active listening'], xpReward: 45 },
        { level: 4, title: 'Speak English With a Partner', description: 'Have a 10-minute English-only conversation with a friend or language partner.', tips: ['Agree to correct each other kindly', 'Focus on fluency, not perfection', 'Keep going even after mistakes'], xpReward: 60 },
        { level: 5, title: 'Join an English Discussion Group', description: 'Join an English conversation club, debate team, or online group and participate actively.', tips: ['Speak at least 3 times per session', 'Ask for clarification when needed', 'Volunteer to summarize discussions'], xpReward: 85 },
      ],
    },
    {
      name: 'Social Anxiety',
      description: 'Ease into social situations — small steps that rewire your brain to feel safe around people.',
      icon: '😰',
      color: '#F59E0B',
      orderIndex: 3,
      levels: [
        { level: 1, title: 'Eye Contact Practice', description: 'Make brief eye contact and smile at 5 people today (cashier, neighbor, classmate).', tips: ['Start with service workers — they expect it', 'A 1-second glance counts', 'Notice most people smile back'], xpReward: 25 },
        { level: 2, title: 'Small Talk Starter', description: 'Start a 30-second conversation with someone new about the weather, class, or surroundings.', tips: ['Use openers: "How is your day going?"', 'One question is enough for level 2', 'Exit gracefully: "Nice talking to you!"'], xpReward: 40 },
        { level: 3, title: 'Join a Group Activity', description: 'Participate in a group activity (study session, sports, club) and speak at least twice.', tips: ['Prepare one comment beforehand', 'Build on what someone else said', 'You do not need to be the loudest voice'], xpReward: 55 },
        { level: 4, title: 'Share an Opinion Publicly', description: 'Share your opinion in a group of 4+ people on a topic you care about.', tips: ['Start with "I think..." or "In my experience..."', 'Disagreement is okay — stay respectful', 'One clear point beats five vague ones'], xpReward: 70 },
        { level: 5, title: 'Host a Mini Gathering', description: 'Invite 2–3 people for coffee, study, or a walk and facilitate conversation for 20 minutes.', tips: ['Have 2-3 topics ready', 'Ask questions to include quieter people', 'Celebrate that you hosted — that is huge'], xpReward: 100 },
      ],
    },
    {
      name: 'Phone & Video Calls',
      description: 'Overcome hesitation on calls — essential for jobs, networking, and modern life.',
      icon: '📞',
      color: '#EC4899',
      orderIndex: 4,
      levels: [
        { level: 1, title: 'Call a Friend', description: 'Make a 5-minute phone call to a friend just to catch up (not text).', tips: ['Schedule it so they expect the call', 'Have one topic ready', 'Walking while talking reduces anxiety'], xpReward: 30 },
        { level: 2, title: 'Business-Style Call', description: 'Call a business or office with a simple question (hours, appointment, info).', tips: ['Write your question on paper first', 'Introduce yourself clearly', 'Thank them before hanging up'], xpReward: 45 },
        { level: 3, title: 'Video Call with Camera On', description: 'Join a video call with camera on for at least 10 minutes.', tips: ['Check lighting and background beforehand', 'Look at the camera when speaking', 'It is okay to mute when not talking'], xpReward: 60 },
        { level: 4, title: 'Lead a Video Meeting', description: 'Lead a 15-minute video call (study group, project sync, family call).', tips: ['Share an agenda in chat first', 'Call on people by name', 'Summarize next steps at the end'], xpReward: 85 },
      ],
    },
  ];

  for (const cat of categories) {
    const created = await prisma.fearCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        color: cat.color,
        orderIndex: cat.orderIndex,
        isActive: true,
        fearLevels: {
          create: cat.levels.map((l) => ({
            levelNumber: l.level,
            title: l.title,
            description: withTips(l.description, l.tips),
            xpReward: l.xpReward,
          })),
        },
      },
    });
    console.log(`  🎯 ${created.icon} ${created.name} (${cat.levels.length} levels)`);
  }
  console.log(`✅ Seeded ${categories.length} fear categories`);
}

async function seedMissions() {
  const missions = [
    {
      title: 'Introduce Yourself in 60 Seconds',
      description: 'Record a 60-second self-introduction covering your name, what you study, and one interesting fact about yourself.',
      whyItHelps: 'Self-introductions are the foundation of every social and professional interaction. Practicing this builds neural pathways that make it feel natural over time.',
      prompt: 'Hi, my name is... I study... One interesting thing about me is...',
      category: 'speaking',
      difficulty: 'easy',
      xpReward: 50,
      estimatedMinutes: 5,
      tips: ['Stand straight and breathe deeply before you start', 'Smile — it genuinely changes the tone of your voice', 'Speak slower than you think you need to'],
    },
    {
      title: 'Talk About Your Favorite Subject',
      description: 'Speak for 90 seconds about a subject you love. Explain it as if teaching someone who knows nothing about it.',
      whyItHelps: 'Speaking about something you know builds confidence quickly. It proves to your brain that you have valuable things to share.',
      prompt: 'My favorite subject is... because... Let me explain how it works...',
      category: 'academic',
      difficulty: 'easy',
      xpReward: 50,
      estimatedMinutes: 8,
      tips: ['Start with "why you love it" — passion is contagious', 'Use simple analogies to explain complex ideas', 'End with a question to invite engagement'],
    },
    {
      title: 'Why Should We Choose You?',
      description: 'Give a 90-second answer to the classic interview question: "Tell me why we should hire you."',
      whyItHelps: 'This builds self-advocacy — the ability to clearly articulate your own value. A critical life skill for interviews, class, and leadership.',
      prompt: 'You should choose me because... My top strength is... I will bring...',
      category: 'speaking',
      difficulty: 'medium',
      xpReward: 75,
      estimatedMinutes: 10,
      tips: ['Structure it: strength → example → result', 'Be specific, not vague. "I built X in 3 weeks" is powerful', 'End with enthusiasm — energy matters'],
    },
    {
      title: 'Speak in Front of a Mirror',
      description: 'Stand in front of a mirror and speak for 2 minutes on any topic. Maintain eye contact with your reflection.',
      whyItHelps: 'Mirror practice builds awareness of your facial expressions, posture, and body language — the silent 55% of communication.',
      prompt: 'Look at yourself and speak about your day, your goals, or anything on your mind.',
      category: 'speaking',
      difficulty: 'easy',
      xpReward: 40,
      estimatedMinutes: 5,
      tips: ['Hold eye contact with your reflection', "Don't judge your appearance — focus on your delivery", 'Notice when you look away — practice holding the gaze'],
    },
    {
      title: 'Describe Your Life Goals',
      description: 'Record a 2-minute speech about where you see yourself in 5 years and the steps you are taking to get there.',
      whyItHelps: 'Articulating your goals out loud reinforces your identity and purpose — a powerful psychological confidence booster.',
      prompt: 'In 5 years, I see myself... The steps I am taking right now are... The biggest challenge I face is...',
      category: 'speaking',
      difficulty: 'medium',
      xpReward: 75,
      estimatedMinutes: 10,
      tips: ['Be honest, not just impressive', 'Include both achievements and challenges — vulnerability builds connection', 'Speak with conviction, even if uncertain'],
    },
    {
      title: 'Explain a Problem You Solved',
      description: 'Tell a 2-minute story about a real problem you faced and how you solved it. Use the STAR format.',
      whyItHelps: 'Storytelling with structure is one of the most valued skills in interviews and leadership.',
      prompt: 'The situation was... My task was... I took these actions... The result was...',
      category: 'speaking',
      difficulty: 'medium',
      xpReward: 80,
      estimatedMinutes: 12,
      tips: ['Situation in 20 seconds, Action in 60 seconds, Result in 40 seconds', 'Use numbers when possible ("saved 2 hours")', 'End with what you learned'],
    },
    {
      title: 'Practice Urdu-English Mix Naturally',
      description: 'Speak for 90 seconds mixing Urdu and English naturally — as you would in real life with friends.',
      whyItHelps: 'Many learners code-switch. Owning your natural style reduces shame and builds authentic confidence.',
      prompt: 'Aaj main baat karunga about... Actually let me explain in English...',
      category: 'speaking',
      difficulty: 'easy',
      xpReward: 45,
      estimatedMinutes: 8,
      tips: ['Do not apologize for mixing languages', 'Clarity matters more than pure English', 'Record and listen — you will sound more natural than you think'],
    },
    {
      title: 'Give Constructive Feedback',
      description: 'Record a 60-second message giving kind, specific feedback to a friend or teammate on something they did well and one improvement area.',
      whyItHelps: 'Giving feedback requires assertiveness and empathy — both core confidence skills.',
      prompt: 'What you did well was... One thing to try next time is... I appreciate that you...',
      category: 'social',
      difficulty: 'hard',
      xpReward: 90,
      estimatedMinutes: 10,
      tips: ['Start with genuine praise', 'Use "I noticed..." not "You always..."', 'End on encouragement'],
    },
    {
      title: 'Morning Intention Speech',
      description: 'Each morning, speak your top 3 intentions for the day out loud in 45 seconds.',
      whyItHelps: 'Vocalizing intentions activates commitment and reduces anxiety about the day ahead.',
      prompt: 'Today I will focus on... I will push myself to... I will be kind to myself when...',
      category: 'speaking',
      difficulty: 'easy',
      xpReward: 35,
      estimatedMinutes: 3,
      tips: ['Do it before checking your phone', 'Stand up while speaking', 'Same time every day builds habit'],
    },
    {
      title: 'Debate Both Sides',
      description: 'Pick a topic you care about. Argue FOR it for 60 seconds, then AGAINST it for 60 seconds.',
      whyItHelps: 'Debating both sides trains mental flexibility and reduces fear of being wrong in public.',
      prompt: 'First: Here is why I support... Then: However, the other side argues...',
      category: 'academic',
      difficulty: 'hard',
      xpReward: 95,
      estimatedMinutes: 15,
      tips: ['Use a timer for each side', 'Really commit to each position', 'This is practice — no one is grading you'],
    },
  ];

  const createdMissions: Mission[] = [];
  for (const m of missions) {
    const mission = await prisma.mission.create({
      data: {
        title: m.title,
        description: withWhyItHelps(m.description, m.whyItHelps),
        category: m.category,
        difficulty: mapDifficulty(m.difficulty),
        xpReward: m.xpReward,
        estimatedMinutes: m.estimatedMinutes,
        tips: m.tips,
        prompt: m.prompt,
        isActive: true,
      },
    });
    createdMissions.push(mission);
  }

  // Set today's daily mission to the first one
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  await prisma.dailyMission.create({
    data: { missionId: createdMissions[0].id, date: today },
  });

  console.log(`✅ Seeded ${missions.length} missions (+ today's daily mission)`);
}

async function seedChallenges() {
  const challenges = [
    { title: 'Smile and Greet 3 Strangers', description: 'Today, make eye contact, smile, and say "Hello" to 3 people you do not know.', whyItHelps: 'Small social acts rewire your brain to see interaction as safe and positive.', category: 'social', difficulty: 'easy', xpReward: 30, durationDays: 1, tips: ['Start with service workers — they are paid to be friendly', 'A nod counts if verbal feels too hard', 'Notice how people respond positively'] },
    { title: 'Start a Conversation with Someone New', description: 'Strike up a conversation with someone you have never spoken to before and keep it going for at least 2 minutes.', whyItHelps: 'Every conversation you initiate proves to yourself that you can do it.', category: 'social', difficulty: 'medium', xpReward: 50, durationDays: 3, tips: ['Ask open-ended questions', 'Listen more than you speak', 'Find common ground quickly'] },
    { title: 'Join a Group Conversation', description: 'Find a group of 3+ people talking and add a meaningful contribution to the conversation.', whyItHelps: 'Group dynamics are the hardest social skill. Practice builds fluency.', category: 'social', difficulty: 'hard', xpReward: 80, durationDays: 7, tips: ['Wait for a natural pause before jumping in', 'Build on what someone just said', 'One strong point is better than many weak ones'] },
    { title: 'Ask One Question in Class', description: 'Raise your hand and ask one question during a class or lecture today.', whyItHelps: 'Asking questions signals intellectual engagement and builds academic confidence.', category: 'academic', difficulty: 'easy', xpReward: 35, durationDays: 1, tips: ['Prepare the question before class starts', 'Write it down so you do not forget', 'Remember: others are thinking the same thing'] },
    { title: 'Answer a Question in Class', description: 'Volunteer to answer a question in class, even if you are not 100% sure of the answer.', whyItHelps: 'Speaking up in class is one of the most common fears — conquering it unlocks academic confidence.', category: 'academic', difficulty: 'medium', xpReward: 50, durationDays: 3, tips: ['Start with "I think..." to feel less pressure', 'Wrong answers still earn respect for courage', 'Your professor wants participation'] },
    { title: 'Explain a Topic to a Classmate', description: 'Take a subject you are studying and explain it out loud to a classmate, friend, or family member.', whyItHelps: 'Teaching is the deepest form of learning AND builds communication confidence simultaneously.', category: 'academic', difficulty: 'medium', xpReward: 55, durationDays: 5, tips: ['Use analogies to simplify', 'Ask "does that make sense?" to check understanding', 'The simpler your explanation, the deeper your mastery'] },
    { title: 'Lead a Study Group Session', description: 'Organize and lead a 30-minute study session with 2–3 classmates, covering one specific topic.', whyItHelps: 'Leadership in academic settings builds both confidence and academic skill simultaneously.', category: 'academic', difficulty: 'hard', xpReward: 90, durationDays: 7, tips: ['Prepare an agenda beforehand', 'Assign each person a subtopic to explain', 'Summarize key points at the end'] },
    { title: 'Read Aloud for 5 Minutes', description: 'Pick any book, article, or text and read it aloud for 5 minutes with clear pronunciation and expression.', whyItHelps: 'Reading aloud trains your vocal mechanics, pace, and clarity — the three pillars of great speaking.', category: 'speaking', difficulty: 'easy', xpReward: 30, durationDays: 1, tips: ['Pause at punctuation', 'Vary your tone — do not be monotone', 'Record yourself and listen back'] },
    { title: 'Record a 60-Second Opinion', description: 'Pick a topic you care about and record a 60-second video sharing your opinion on it.', whyItHelps: 'Recording yourself creates accountability and helps you identify specific areas to improve.', category: 'speaking', difficulty: 'medium', xpReward: 60, durationDays: 3, tips: ['Watch it back — once is enough', "Focus on one point, don't try to cover everything", 'Energy matters more than perfection'] },
    { title: 'Give a 3-Minute Impromptu Speech', description: 'Set a timer for 3 minutes. Pick a random topic and speak about it without preparation.', whyItHelps: 'Impromptu speaking is the hardest — and most valuable — speaking skill to develop.', category: 'speaking', difficulty: 'hard', xpReward: 85, durationDays: 5, tips: ['Use: Point, Reason, Example structure', 'Silence is fine — slow down, do not fill with "um"', 'Start strong: open with a bold statement'] },
    { title: 'Power Pose for 2 Minutes', description: 'Stand in a "Wonder Woman" or "Superman" power pose for 2 minutes before a stressful event.', whyItHelps: 'Research shows power poses increase confidence hormones and reduce stress before high-pressure moments.', category: 'sports', difficulty: 'easy', xpReward: 20, durationDays: 1, tips: ['Do it in private before a presentation or exam', 'Combine with deep breathing', 'Hold for the full 2 minutes — it gets easier'] },
    { title: 'Join a Sports Team Activity', description: 'Participate in a group sports activity — a game, practice session, or gym class.', whyItHelps: 'Physical team activities build non-verbal confidence and reduce social anxiety through shared experience.', category: 'sports', difficulty: 'medium', xpReward: 55, durationDays: 7, tips: ['Focus on effort, not skill level', 'Encourage teammates — leadership earns respect', 'Move your body confidently even when uncertain'] },
    { title: 'Share a Creative Work', description: 'Share something you created — a drawing, poem, photo, or idea — with at least one person.', whyItHelps: 'Sharing creative work is deeply vulnerable and builds enormous emotional courage.', category: 'creative', difficulty: 'medium', xpReward: 60, durationDays: 5, tips: ['Start with someone you trust', 'Share the process, not just the output', 'Accept feedback with "thank you"'] },
    { title: 'Perform Something for 3 People', description: 'Sing, recite a poem, play music, or do any creative performance in front of at least 3 people.', whyItHelps: 'Performance is the ultimate confidence crucible — it trains you to stay present under pressure.', category: 'creative', difficulty: 'hard', xpReward: 95, durationDays: 7, tips: ['Rehearse enough to be comfortable, not perfect', 'Look at your audience, not your feet', 'Imperfection is part of the charm'] },
    // Enhanced additions
    { title: '7-Day Speaking Streak', description: 'Practice speaking (mission or speech session) every day for 7 consecutive days.', whyItHelps: 'Consistency compounds — small daily reps beat occasional intense practice.', category: 'speaking', difficulty: 'medium', xpReward: 120, durationDays: 7, tips: ['Set a fixed time each day', 'Even 3 minutes counts', 'Track your streak in the app'] },
    { title: 'Compliment 5 People Genuinely', description: 'Give a specific, sincere compliment to 5 different people this week.', whyItHelps: 'Giving compliments builds social courage and strengthens relationships.', category: 'social', difficulty: 'easy', xpReward: 40, durationDays: 7, tips: ['Be specific: "I liked how you explained..."', 'Avoid appearance-only compliments', 'Notice how good it feels to make someone smile'] },
    { title: 'No Filler Word Challenge', description: 'Complete one speech or recording with zero "um", "uh", "like", or "you know".', whyItHelps: 'Eliminating fillers makes you sound instantly more confident and prepared.', category: 'speaking', difficulty: 'hard', xpReward: 100, durationDays: 3, tips: ['Pause silently instead of filling', 'Slow down — fillers come from rushing', 'Use the app speech analysis to track fillers'] },
    { title: 'Network with One Professional', description: 'Message or speak with one professional in your field — ask one thoughtful question.', whyItHelps: 'Professional networking is a confidence multiplier for career growth.', category: 'social', difficulty: 'medium', xpReward: 70, durationDays: 5, tips: ['LinkedIn or email is fine', 'Keep the ask small and specific', 'Thank them regardless of response'] },
  ];

  for (const c of challenges) {
    await prisma.challenge.create({
      data: {
        title: c.title,
        description: withWhyItHelps(c.description, c.whyItHelps),
        category: c.category,
        difficulty: mapDifficulty(c.difficulty),
        xpReward: c.xpReward,
        durationDays: c.durationDays,
        tips: c.tips,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${challenges.length} challenges`);
}

async function seedSkillTree() {
  const nodes = [
    // Speaking branch
    { name: 'Vocal Basics', description: '🎙️ Understand the fundamentals of clear, audible speech.', branch: 'speaking', tier: 1, xpRequired: 0, x: 60, y: 500, parentTier: null },
    { name: 'Fluency', description: '🌊 Speak smoothly with minimal pauses and filler words.', branch: 'speaking', tier: 2, xpRequired: 100, x: 60, y: 400, parentTier: 1 },
    { name: 'Speed Control', description: '⏱️ Vary your speaking pace for emphasis and clarity.', branch: 'speaking', tier: 3, xpRequired: 300, x: 60, y: 300, parentTier: 2 },
    { name: 'Clarity Master', description: '✨ Consistently deliver clear, well-articulated speech.', branch: 'speaking', tier: 4, xpRequired: 600, x: 60, y: 200, parentTier: 3 },
    { name: 'Storytelling', description: '📖 Engage any audience with compelling narrative structure.', branch: 'speaking', tier: 5, xpRequired: 1000, x: 60, y: 100, parentTier: 4 },
    // Confidence branch
    { name: 'Self-Awareness', description: '🪞 Recognize your emotional patterns in social situations.', branch: 'confidence', tier: 1, xpRequired: 0, x: 160, y: 500, parentTier: null },
    { name: 'Anxiety Control', description: '🧘 Use breathing and reframing to manage performance anxiety.', branch: 'confidence', tier: 2, xpRequired: 100, x: 160, y: 400, parentTier: 1 },
    { name: 'Presence', description: '👁️ Command attention by being fully present and grounded.', branch: 'confidence', tier: 3, xpRequired: 300, x: 160, y: 300, parentTier: 2 },
    { name: 'Resilience', description: '💪 Bounce back quickly from setbacks, criticism, or failures.', branch: 'confidence', tier: 4, xpRequired: 600, x: 160, y: 200, parentTier: 3 },
    { name: 'Unshakeable', description: '🛡️ Maintain composure and confidence in any high-pressure situation.', branch: 'confidence', tier: 5, xpRequired: 1000, x: 160, y: 100, parentTier: 4 },
    // Communication branch
    { name: 'Active Listening', description: '👂 Fully absorb what others say before responding.', branch: 'communication', tier: 1, xpRequired: 0, x: 260, y: 500, parentTier: null },
    { name: 'Vocabulary Builder', description: '📚 Express ideas more precisely with a richer word bank.', branch: 'communication', tier: 2, xpRequired: 100, x: 260, y: 400, parentTier: 1 },
    { name: 'Sentence Structure', description: '✍️ Construct clear, concise, and impactful sentences.', branch: 'communication', tier: 3, xpRequired: 300, x: 260, y: 300, parentTier: 2 },
    { name: 'Persuasion', description: '🎯 Influence others through logic, emotion, and credibility.', branch: 'communication', tier: 4, xpRequired: 600, x: 260, y: 200, parentTier: 3 },
    { name: 'Master Communicator', description: '🌟 Command any conversation in any setting with grace and impact.', branch: 'communication', tier: 5, xpRequired: 1000, x: 260, y: 100, parentTier: 4 },
  ];

  const branchMap: Record<string, Record<number, string>> = {
    speaking: {},
    confidence: {},
    communication: {},
  };

  for (const n of nodes) {
    const parentNodeId =
      n.parentTier != null ? branchMap[n.branch][n.parentTier] : null;

    const created = await prisma.skillNode.create({
      data: {
        name: n.name,
        description: n.description,
        branch: n.branch,
        tier: n.tier,
        parentNodeId,
        xpRequired: n.xpRequired,
        positionX: n.x,
        positionY: n.y,
        isActive: true,
      },
    });
    branchMap[n.branch][n.tier] = created.id;
  }
  console.log(`✅ Seeded ${nodes.length} skill tree nodes`);
}

async function seedAnnouncements() {
  const now = new Date();
  const in30Days = new Date(now);
  in30Days.setDate(in30Days.getDate() + 30);

  const announcements = [
    {
      title: 'Welcome to ConfidenceUp! 🚀',
      body: 'Your confidence journey starts here. Complete today\'s mission, build your streak, and climb the fear ladder one step at a time. Remember: progress beats perfection.',
      type: AnnouncementType.INFO,
    },
    {
      title: 'Daily Check-In Bonus ☀️',
      body: 'Open the app each day and tap Check-In to earn +10 XP and keep your streak alive. Consistency is the secret to lasting confidence.',
      type: AnnouncementType.INFO,
    },
    {
      title: 'New Fear Category: Phone & Video Calls 📞',
      body: 'We added a new fear ladder for phone and video call anxiety. Start at Level 1 — call a friend for 5 minutes. You\'ve got this!',
      type: AnnouncementType.UPDATE,
    },
  ];

  for (const a of announcements) {
    await prisma.announcement.create({
      data: {
        title: a.title,
        body: a.body,
        type: a.type,
        startsAt: now,
        endsAt: in30Days,
        isActive: true,
      },
    });
  }
  console.log(`✅ Seeded ${announcements.length} announcements`);
}

async function seedAppVersions() {
  await prisma.appVersion.createMany({
    data: [
      {
        platform: Platform.ANDROID,
        version: '1.0.0',
        minSupportedVersion: '1.0.0',
        isForceUpdate: false,
        releaseNotes: '🎉 Initial release — missions, challenges, fear ladder, speech practice, and streaks.',
      },
      {
        platform: Platform.IOS,
        version: '1.0.0',
        minSupportedVersion: '1.0.0',
        isForceUpdate: false,
        releaseNotes: '🎉 Initial release — missions, challenges, fear ladder, speech practice, and streaks.',
      },
    ],
  });
  console.log('✅ Seeded app versions');
}

async function main() {
  console.log('🌱 Seeding ConfidenceUp database...\n');
  await clearContent();
  await seedBadges();
  await seedFearCategories();
  await seedMissions();
  await seedChallenges();
  await seedSkillTree();
  await seedAnnouncements();
  await seedAppVersions();
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
