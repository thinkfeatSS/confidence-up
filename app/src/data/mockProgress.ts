import { UserProgress, SpeechSession, DailyScore } from '../types';

export const mockSpeechSessions: SpeechSession[] = [
  {
    id: 'speech-1',
    date: '2026-05-24',
    prompt: 'Introduce yourself in 60 seconds',
    overallScore: 82,
    clarityScore: 88,
    fillerCount: 2,
    paceWPM: 140,
    toneScore: 78,
    transcript: 'Hi, my name is Ismail. I am a computer science student in my third year. [um] I am passionate about building apps that solve real problems for real people. One interesting fact about me is that I started learning programming when I was 14 years old. [uh] I hope to one day build products that millions of people use.',
    fillerWords: ['um', 'uh'],
    feedback: [
      'Great job reducing filler words — only 2 detected. You are in the top 30% of users.',
      'Your pace of 140 WPM is excellent — clear and digestible for listeners.',
      'Work on your closing: end with a stronger, more memorable statement rather than trailing off.',
    ],
    xpEarned: 70,
  },
  {
    id: 'speech-2',
    date: '2026-05-22',
    prompt: 'Why should we choose you?',
    overallScore: 74,
    clarityScore: 79,
    fillerCount: 5,
    paceWPM: 155,
    toneScore: 68,
    transcript: 'You should choose me because [um] I am a hard worker and I always [like] give 100% to everything I do. [um] I have experience in software development and [uh] I built a mobile app for my university project. [like] I think I would be a good fit because I learn fast.',
    fillerWords: ['um', 'like', 'uh'],
    feedback: [
      'Your filler word count of 5 is above average. Try pausing silently instead of filling with "um" or "like".',
      'Your pace is slightly fast at 155 WPM — slow down by 10-15 WPM for better impact.',
      'Strong specific example (mobile app). Add one metric: "an app used by 200+ students" is more powerful.',
    ],
    xpEarned: 50,
  },
  {
    id: 'speech-3',
    date: '2026-05-20',
    prompt: 'Talk about your favorite subject',
    overallScore: 68,
    clarityScore: 72,
    fillerCount: 8,
    paceWPM: 168,
    toneScore: 62,
    transcript: 'My favorite subject is [um] computer science because [like] it is very interesting and [um] you can build things with it. [uh] Like you can [um] make apps and [like] websites. I think everyone should learn [um] programming because [like] it is the future.',
    fillerWords: ['um', 'like', 'uh'],
    feedback: [
      '8 filler words detected — this is the main area to improve. Practice pausing silently.',
      'Your explanation lacked specific detail. Instead of "it is interesting", say "I can turn an idea into a working product in days."',
      'Work on varying your tone. You sound monotone — try emphasizing key words with volume and pace changes.',
    ],
    xpEarned: 30,
  },
];

const generateConfidenceHistory = (): DailyScore[] => {
  const days = 30;
  const today = new Date('2026-05-24');
  const scores: DailyScore[] = [];
  let currentScore = 45;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const variation = (Math.random() - 0.3) * 6;
    currentScore = Math.min(95, Math.max(30, currentScore + variation));
    scores.push({
      date: date.toISOString().split('T')[0],
      score: Math.round(currentScore),
    });
  }

  // Override last few days with the user's actual progress arc
  scores[27].score = 68;
  scores[28].score = 71;
  scores[29].score = 74;

  return scores;
};

export const mockProgress: UserProgress = {
  confidenceHistory: generateConfidenceHistory(),
  speechSessions: mockSpeechSessions,
  totalXP: 9740,
  weeklyXP: 840,
  bestStreak: 12,
  totalSpeeches: 18,
  totalChallenges: 34,
  averageScore: 74,
};
