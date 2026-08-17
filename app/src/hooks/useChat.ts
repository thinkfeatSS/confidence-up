import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { initialMessages } from '../data/mockChat';
import { sendCoachMessage } from '../modules/coach/services/coachService';

let messageCounter = 100;

const createId = () => `msg-${++messageCounter}`;

type CoachContext = {
  streak?: number;
  confidenceScore?: number;
  lastSessionScore?: number;
};

export const useChat = (context?: CoachContext) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };

      const nextMessages = [...messages, userMessage];
      setMessages(nextMessages);
      setIsTyping(true);

      try {
        const history = nextMessages.map(message => ({
          role: message.role === 'ai' ? 'assistant' as const : 'user' as const,
          content: message.content,
        }));
        const reply = await sendCoachMessage(history, context);
        const aiMessage: ChatMessage = {
          id: createId(),
          role: 'ai',
          content: reply,
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } catch {
        const aiMessage: ChatMessage = {
          id: createId(),
          role: 'ai',
          content: 'I could not reach Atlas right now. Try again in a moment.',
          timestamp: new Date().toISOString(),
        };
        setMessages(prev => [...prev, aiMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [context, messages],
  );

  const clearChat = useCallback(() => {
    setMessages(initialMessages);
  }, []);

  return { messages, isTyping, sendMessage, clearChat };
};
