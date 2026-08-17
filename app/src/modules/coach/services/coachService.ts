import { apiClient, unwrapApiData } from '../../../services/api';

type CoachMessage = { role: 'user' | 'assistant'; content: string };

type CoachContext = {
  streak?: number;
  confidenceScore?: number;
  lastSessionScore?: number;
};

export async function sendCoachMessage(messages: CoachMessage[], context?: CoachContext) {
  const res = await apiClient.post<any, any>('/coach/chat', { messages, context });
  const data = unwrapApiData<{ reply: string }>(res);
  return data.reply;
}
