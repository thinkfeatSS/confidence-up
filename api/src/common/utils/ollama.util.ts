import { Logger } from '@nestjs/common';

const logger = new Logger('OllamaClient');

export type GenerateOllamaArgs = {
  baseUrl?: string;
  model?: string;
  prompt?: string;
  systemPrompt?: string;
  messages?: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
};

export async function generateOllamaText(args: GenerateOllamaArgs): Promise<{
  text: string;
  model: string;
}> {
  const baseUrl = (args.baseUrl || process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  const model = args.model || process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const timeoutMs = args.timeoutMs ?? 30000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let body: Record<string, unknown>;

    if (args.messages && args.messages.length > 0) {
      body = {
        model,
        messages: args.messages,
        stream: false,
        options: {
          temperature: args.temperature ?? (args.jsonMode ? 0.3 : 0.7),
        },
        ...(args.jsonMode ? { format: 'json' } : {}),
      };

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ollama chat failed (${response.status}): ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as { message?: { content?: string }; model?: string };
      const text = data.message?.content?.trim() ?? '';
      if (!text) throw new Error('Empty response from Ollama chat');
      return { text, model: data.model || model };
    } else {
      body = {
        model,
        prompt: args.prompt ?? '',
        system: args.systemPrompt,
        stream: false,
        options: {
          temperature: args.temperature ?? (args.jsonMode ? 0.3 : 0.7),
        },
        ...(args.jsonMode ? { format: 'json' } : {}),
      };

      const response = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`Ollama generate failed (${response.status}): ${errorText || response.statusText}`);
      }

      const data = (await response.json()) as { response?: string; model?: string };
      const text = data.response?.trim() ?? '';
      if (!text) throw new Error('Empty response from Ollama generate');
      return { text, model: data.model || model };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logger.warn(`Ollama request failed [${baseUrl}, model: ${model}]: ${message}`);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateOllamaJson(
  args: GenerateOllamaArgs,
): Promise<{ parsed: Record<string, unknown>; model: string }> {
  const { text, model } = await generateOllamaText({ ...args, jsonMode: true });
  return { parsed: parseJsonObject(text), model };
}

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Strip markdown code block wrappers if any
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(codeBlockMatch[1]) as Record<string, unknown>;
      } catch {
        // continue
      }
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return {};
    try {
      return JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
