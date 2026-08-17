import { Fear } from '../types';

export const mockFears: Fear[] = [
  {
    id: 'fear-1',
    name: 'Public Speaking',
    icon: '🎤',
    color: '#06B6D4',
    currentLevel: 4,
    levels: [
      { level: 1, title: 'Speak Alone', description: 'Stand in your room and speak for 2 minutes on any topic. No audience.', tips: ['Close your eyes if it helps', 'Just get used to your own voice', 'Record it for yourself only'], xpReward: 30, completed: true },
      { level: 2, title: 'Speak to a Trusted Friend', description: 'Have a 5-minute conversation with your closest friend about a topic you prepared.', tips: ['Choose someone who supports you', 'It does not need to be perfect', 'Focus on delivery, not content'], xpReward: 40, completed: true },
      { level: 3, title: 'Small Group of 3', description: 'Share a 2-minute story or opinion with 3 friends or family members.', tips: ['Pick people who are kind listeners', 'Make eye contact with each person', 'Pause for effect — do not rush'], xpReward: 55, completed: true },
      { level: 4, title: 'Record a Video', description: 'Record a 2-minute video on your phone speaking about any topic. Watch it back once.', tips: ['First watch — only look for positives', 'Second watch — identify one thing to improve', 'You will cringe — everyone does. Push through'], xpReward: 65, completed: false },
      { level: 5, title: 'Present to a Small Class', description: 'Give a 3-minute presentation in front of 5–10 people in a classroom setting.', tips: ['Start with a hook — a question or bold statement', 'Move slowly and deliberately', 'Breathe between slides or points'], xpReward: 80, completed: false },
      { level: 6, title: 'Q&A Session', description: 'After a presentation, invite and answer questions from the audience for 5 minutes.', tips: ['Listen fully before answering', '"Great question" buys you thinking time', 'It is okay to say "I will find out"'], xpReward: 90, completed: false },
      { level: 7, title: 'Formal Presentation', description: 'Give a structured 5-minute formal presentation with slides to a class or group.', tips: ['Rehearse with a timer', 'Practice transitions between slides', 'Make your opening memorable'], xpReward: 100, completed: false },
      { level: 8, title: 'Debate Participation', description: 'Participate in a structured debate, arguing a position in front of an audience.', tips: ['Know your strongest 2-3 arguments cold', 'Counter-arguments make you stronger', 'Stay calm when challenged'], xpReward: 120, completed: false },
      { level: 9, title: 'Workshop Facilitation', description: 'Lead a 15-minute workshop or discussion session for a group of 10+ people.', tips: ['Ask questions to keep people engaged', 'Manage time visually (write on board)', 'Energy is contagious — bring yours'], xpReward: 150, completed: false },
      { level: 10, title: 'Stage Speech', description: 'Deliver a prepared 5-minute speech from a stage or elevated platform to 20+ people.', tips: ['Own the stage — move purposefully', 'Make someone in the back feel included', 'End with a memorable call to action'], xpReward: 200, completed: false },
    ],
  },
  {
    id: 'fear-2',
    name: 'Job Interviews',
    icon: '💼',
    color: '#A855F7',
    currentLevel: 2,
    levels: [
      { level: 1, title: 'Self-Interview Alone', description: 'Ask yourself common interview questions out loud and answer them in full sentences.', tips: ['Use "STAR" method: Situation, Task, Action, Result', 'Record your answers', 'Time each answer (aim for 90 seconds)'], xpReward: 30, completed: true },
      { level: 2, title: 'Mock Interview with a Friend', description: 'Ask a friend to interview you using 5 standard questions. Get honest feedback.', tips: ['Dress appropriately even for mock interviews — it shifts your mindset', 'Ask for honest feedback after', 'Practice your handshake / greeting'], xpReward: 45, completed: false },
      { level: 3, title: 'Research a Company and Present', description: 'Research a company you want to work for and give a 3-minute verbal summary of what they do and why you want to work there.', tips: ['Look at their mission, products, recent news', '"Why this company?" is almost always asked', 'Show genuine interest, not just memorized facts'], xpReward: 55, completed: false },
      { level: 4, title: 'Record Video Mock Interview', description: 'Set up your camera and do a full 15-minute mock interview answering 10 questions on video.', tips: ['Watch it back focusing on filler words', 'Notice your body language', 'Improve one thing per attempt'], xpReward: 70, completed: false },
      { level: 5, title: 'Real Informational Interview', description: 'Reach out to a professional in your field and request a 15-minute informational interview.', tips: ['Send a professional email request', 'Come with prepared questions', 'Send a thank-you message after'], xpReward: 100, completed: false },
    ],
  },
  {
    id: 'fear-3',
    name: 'English Speaking',
    icon: '🗣️',
    color: '#10B981',
    currentLevel: 3,
    levels: [
      { level: 1, title: 'Think in English for 10 Min', description: 'Narrate your actions mentally in English for 10 continuous minutes.', tips: ['Narrate what you are doing: "I am walking to..."', 'No pressure to be grammatically perfect', 'This builds automatic language retrieval'], xpReward: 25, completed: true },
      { level: 2, title: 'Speak English to Yourself Daily', description: 'Have a 5-minute self-talk session in English about your day every evening.', tips: ['Talk about what happened, what you felt, what you learned', 'No script — go natural', 'Consistency beats perfection'], xpReward: 35, completed: true },
      { level: 3, title: 'Watch English Content Without Subtitles', description: 'Watch 20 minutes of English video content with no subtitles and summarize what you watched.', tips: ['Start with slower speakers', 'Pause and repeat if needed', 'The summary exercise forces active listening'], xpReward: 45, completed: false },
      { level: 4, title: 'Speak English With a Partner', description: 'Have a 10-minute English-only conversation with a friend or language partner.', tips: ['Agree to correct each other kindly', 'Focus on fluency, not perfection', 'Keep going even after mistakes'], xpReward: 60, completed: false },
      { level: 5, title: 'Join an English Discussion Group', description: 'Join an English conversation club, debate team, or online group and participate actively.', tips: ['Speak at least 3 times per session', 'Ask for clarification when needed', 'Volunteer to summarize discussions'], xpReward: 85, completed: false },
    ],
  },
];
