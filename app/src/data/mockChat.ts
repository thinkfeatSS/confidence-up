import { ChatMessage } from '../types';

export const initialMessages: ChatMessage[] = [
  {
    id: 'init-1',
    role: 'ai',
    content: "Hey Ismail! 👋 I'm Atlas, your AI confidence coach. I'm here whenever you need guidance, motivation, or a practical strategy.\n\nHow are you feeling about your confidence journey today?",
    timestamp: new Date().toISOString(),
  },
];

// Keyword-based response map for the mock AI coach
// Keys are lowercase keywords; values are AI responses
export const aiResponseMap: Record<string, string> = {
  nervous: "Feeling nervous is completely normal — even the most confident people feel this way. Here's what actually works:\n\n1️⃣ **Take 4 deep breaths**: 4 counts in, hold 4, out 4. This activates your parasympathetic nervous system.\n2️⃣ **Reframe the story**: Instead of 'I'm nervous', say 'I'm excited'. Same physiological state, completely different mindset.\n3️⃣ **Power pose for 2 minutes** before your challenge.\n\nWhat specifically are you nervous about? I can give you a more targeted plan. 💪",

  scared: "Fear is your body preparing you to perform — it's not a warning to stop, it's energy to use. Here's my 3-step protocol:\n\n1️⃣ **Name the fear** specifically. Not 'I'm scared' but 'I'm scared of forgetting my words at minute 2'.\n2️⃣ **Prepare for that exact scenario** — what would you do? Practice recovering.\n3️⃣ **Shrink it down** — do the smallest possible version first.\n\nYou've already completed Level 3 of your Public Speaking fear. That's real courage. Keep going. 🔥",

  presentation: "Presentations feel scary because of **audience judgment + memory pressure**. Here's my battle-tested prep system:\n\n1️⃣ **Know your opening cold** — the first 30 seconds sets everything\n2️⃣ **Use the 3-point rule**: One intro, 3 main points, one strong close\n3️⃣ **Practice out loud 3x** minimum — not in your head, out loud\n4️⃣ **Accept imperfection** — the audience roots for you, not against you\n\nWhat's the presentation about? I can help you structure it. 📋",

  interview: "Interviews are winnable with the right preparation. Here's your system:\n\n1️⃣ **Prepare 5 STAR stories**: Situation, Task, Action, Result — one per key strength\n2️⃣ **Research the company deeply** — know their mission, products, recent news\n3️⃣ **Practice out loud** — not in your head, actually speak the words\n4️⃣ **Prepare 3 questions for them** — it shows genuine interest\n\nThe secret most people miss: **interviews are conversations, not interrogations**. They want you to succeed. 💼",

  tip: "Here's today's confidence tip ✨\n\n**The 5-Second Rule** (by Mel Robbins):\nWhenever you feel hesitation before a bold action, count backwards: 5-4-3-2-1 and move.\n\nWhy it works: Your brain has a 5-second window before hesitation becomes rationalization. The countdown interrupts the fear pattern and triggers your prefrontal cortex.\n\nUse it for: raising your hand, starting a conversation, asking a question, recording a speech.\n\nTry it today. 🚀",

  help: "I'm here for you! Here's what I can help with:\n\n🎤 **Speech prep** — structure, delivery, confidence\n😰 **Managing anxiety** — before presentations, interviews, social situations\n💪 **Challenge guidance** — which to tackle next based on your level\n📈 **Progress check** — what's working and what to focus on\n🧠 **Mindset shifts** — reframing negative self-talk\n\nWhat do you need right now? Just tell me and I'll give you a specific action plan.",

  fail: "I hear you — and I want you to know something important:\n\n**Every confident person has 'failed' at confidence.** It's not a destination, it's a practice.\n\nHere's what the data says about your journey:\n✅ You've completed 34 challenges\n✅ Your confidence score went from 48 to 74\n✅ You're on a 7-day streak\n\nOne bad day does not erase that progress. What happened? Tell me, and let's turn it into your next learning. 💪",

  low: "Low energy days are part of every growth journey — they're not setbacks, they're recovery phases. Here's what I want you to do today:\n\n1️⃣ **Do the smallest possible version** of today's challenge — even 50% counts\n2️⃣ **Read your journal** — specifically the entry from May 23rd when you said 'small victory but huge for me'\n3️⃣ **Remember: showing up when you don't feel like it** is 10x more valuable than showing up when you do\n\nYou've built a 7-day streak. Don't break it over a bad mood. What do you need right now? 🙏",

  improve: "To improve your confidence score, focus on these three high-impact areas:\n\n📊 **Speech Quality (40% weight)**: Your filler words are the fastest win. Practice pausing silently instead of 'um'. Do this for 3 speeches.\n\n✅ **Challenge Completion (30% weight)**: Complete your daily mission — even the easy ones build momentum.\n\n🔥 **Consistency (30% weight)**: Your 7-day streak is already giving you a boost. Just keep showing up.\n\nIf you do those three things for 2 weeks, I predict your score hits 85+. Let's go! 📈",

  default: "That's a great thing to reflect on. Here's my honest take:\n\nConfidence is built through **repeated small acts of courage**, not one big leap. Every challenge you complete, every speech you record, every conversation you initiate — they all compound.\n\nYour current score of 74 puts you in the top 35% of users at your level. You're doing better than you think.\n\nWhat's one specific thing I can help you with today? Give me a challenge, fear, or question and I'll build you a concrete action plan. 💪",
};

export const getAIResponse = (userMessage: string): string => {
  const lower = userMessage.toLowerCase();
  const keys = Object.keys(aiResponseMap).filter(k => k !== 'default');

  for (const key of keys) {
    if (lower.includes(key)) {
      return aiResponseMap[key];
    }
  }

  return aiResponseMap.default;
};
