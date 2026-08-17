import { JournalEntry } from '../types';

export const mockJournal: JournalEntry[] = [
  {
    id: 'j1',
    title: 'Raised my hand in class today!',
    body: 'I finally did it. I raised my hand to answer a question about algorithms. My heart was pounding but I did it. The professor said "Excellent point, Ismail!" and I felt a rush I had not felt in months. This is what growth feels like.',
    mood: 5,
    date: '2026-05-24',
  },
  {
    id: 'j2',
    title: 'Spoke to a stranger at the library',
    body: 'I asked someone if the seat next to them was taken. We ended up talking for 20 minutes about books and studying. Small victory but huge for me.',
    mood: 4,
    date: '2026-05-23',
    linkedChallengeId: 'ch-s2',
  },
  {
    id: 'j3',
    title: 'Tough day. Practice felt hard.',
    body: 'Did the speech practice today but it felt awful. Lots of filler words, lost my train of thought twice. The AI gave me a 52/100. Feeling discouraged. But I did it — showed up even when I did not want to. That has to count for something.',
    mood: 2,
    date: '2026-05-22',
  },
  {
    id: 'j4',
    title: 'Completed fear level 3!',
    body: 'Spoke in front of a small group of friends. Three people. I thought I would freeze but I got through the whole thing. Ahmed even said I sounded natural. Did not believe him at first but maybe it is true.',
    mood: 4,
    date: '2026-05-21',
    linkedChallengeId: 'fear-1',
  },
  {
    id: 'j5',
    title: 'Job interview prep session',
    body: 'Practiced 5 interview questions with Karim. He grilled me hard. "Why should we hire you?" caught me off guard but I recovered. Need to work on: not starting every sentence with "I think..." and making stronger endings.',
    mood: 3,
    date: '2026-05-19',
  },
  {
    id: 'j6',
    title: 'First time speaking English for a full hour',
    body: 'Watched a YouTube video without subtitles and then described what I learned to my sister entirely in English. She actually understood everything. I am getting better.',
    mood: 4,
    date: '2026-05-18',
  },
  {
    id: 'j7',
    title: 'Week 2 reflection',
    body: 'Two weeks in. I have completed 14 challenges. My confidence score went from 48 to 74. The streaks keep me going more than I expected. The AI feedback is surprisingly accurate. Feeling cautiously optimistic.',
    mood: 4,
    date: '2026-05-15',
  },
  {
    id: 'j8',
    title: 'Day 1 — Starting my journey',
    body: 'Downloaded the app today. Quiz said my biggest fear is public speaking. No surprise there. Confidence score: 48. The goal feels impossible right now but I am committing to 30 days. Let us go.',
    mood: 3,
    date: '2026-05-01',
  },
];

export const reflectionPrompts: string[] = [
  'What made you feel proud today?',
  'What was one small win you achieved?',
  'What did you do that pushed your comfort zone?',
  'How did you feel before vs. after today\'s challenge?',
  'What would you tell yourself one week ago?',
  'Name one person who inspired your confidence today.',
  'What fear did you face, even partially?',
  'What is one thing you want to do differently tomorrow?',
  'Describe a moment when you felt genuinely capable.',
  'What progress are you most proud of this week?',
];
