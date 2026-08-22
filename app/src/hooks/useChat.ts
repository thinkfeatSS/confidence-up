import { useState, useCallback, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getInitialMessages, initialMessages } from '../data/mockChat';
import { sendCoachMessage } from '../modules/coach/services/coachService';

let messageCounter = 100;

const createId = () => `msg-${++messageCounter}`;

type CoachContext = {
  userName?: string;
  streak?: number;
  confidenceScore?: number;
  lastSessionScore?: number;
};

export const useChat = (context?: CoachContext, userName?: string) => {
  const resolvedName = userName ?? context?.userName;
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    getInitialMessages(resolvedName),
  );
  const [isTyping, setIsTyping] = useState(false);

  // Update initial greeting message if user profile loads asynchronously
  // and the user has not started a custom chat conversation yet
  useEffect(() => {
    if (resolvedName) {
      setMessages(prev => {
        if (
          prev.length === 1 &&
          prev[0].id === 'init-1' &&
          prev[0].role === 'ai'
        ) {
          return getInitialMessages(resolvedName);
        }
        return prev;
      });
    }
  }, [resolvedName]);

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
          role: message.role === 'ai' ? ('assistant' as const) : ('user' as const),
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
    setMessages(getInitialMessages(resolvedName));
  }, [resolvedName]);

  return { messages, isTyping, sendMessage, clearChat };
};
