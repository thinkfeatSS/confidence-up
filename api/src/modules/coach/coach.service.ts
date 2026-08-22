import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoachChatDto } from './dto/coach-chat.dto';
import { generateOllamaText } from '../../common/utils/ollama.util';

@Injectable()
export class CoachService {
  private readonly logger = new Logger(CoachService.name);

  constructor(private readonly configService: ConfigService) {}

  async chat(dto: CoachChatDto) {
    const lastUser = [...dto.messages].reverse().find(message => message.role === 'user');
    const userMessage = lastUser?.content?.trim() ?? '';

    if (!userMessage) {
      return { reply: 'Tell me what you would like to work on today.', provider: 'fallback' as const };
    }

    const baseUrl = this.configService.get<string>('ollama.baseUrl') ?? 'http://127.0.0.1:11434';
    const modelName = this.configService.get<string>('ollama.model') ?? 'llama3.2:3b';

    try {
      const contextLines = [
        dto.context?.userName ? `User name: ${dto.context.userName}` : null,
        dto.context?.streak !== undefined ? `Current streak: ${dto.context.streak} days` : null,
        dto.context?.confidenceScore !== undefined
          ? `Confidence score: ${dto.context.confidenceScore}`
          : null,
        dto.context?.lastSessionScore !== undefined
          ? `Last speaking session score: ${dto.context.lastSessionScore}`
          : null,
      ]
        .filter(Boolean)
        .join('\n');

      const systemPrompt = `You are Atlas, an expert and concise confidence coach for the SpeakUpMic app.
Give practical, actionable speaking and confidence advice. No medical or therapy claims.
Keep replies under 120 words unless the user asks for detail.
${contextLines ? `User context:\n${contextLines}` : ''}`;

      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...dto.messages.slice(-10).map(m => ({
          role: m.role === 'user' ? ('user' as const) : ('assistant' as const),
          content: m.content,
        })),
      ];

      const { text, model } = await generateOllamaText({
        baseUrl,
        model: modelName,
        messages: chatMessages,
        temperature: 0.7,
      });

      return {
        reply: text || this.fallbackReply(userMessage, dto.context),
        provider: 'ollama' as const,
        model,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Ollama coach chat failed, using fallback: ${message}`);

      return {
        reply: this.fallbackReply(userMessage, dto.context),
        provider: 'fallback' as const,
      };
    }
  }

  private fallbackReply(userMessage: string, context?: CoachChatDto['context']) {
    const lower = userMessage.toLowerCase();
    if (lower.includes('nervous') || lower.includes('anxious')) {
      return 'Before you speak, take one slow breath and start with your main point in a single sentence. Short openings reduce nerves fast.';
    }
    if (lower.includes('interview')) {
      return 'Structure interview answers as: direct answer → one example → confident close. Practice aloud twice before the real conversation.';
    }
    if (context?.lastSessionScore !== undefined && context.lastSessionScore < 65) {
      return 'Your last session has clear room to grow. Pick one prompt, answer in 45 seconds, and focus on staying on topic from the first sentence.';
    }
    return 'Great question. Pick one small speaking goal for today — clarity, energy, or structure — and practice it in a 60-second recording.';
  }
}
