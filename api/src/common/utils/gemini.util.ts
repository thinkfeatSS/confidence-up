import { Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

const logger = new Logger('GeminiClient');

const FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite',
];

export function uniqueModels(preferred?: string): string[] {
  const list = [preferred?.trim(), ...FALLBACK_MODELS].filter(
    (m): m is string => Boolean(m),
  );
  return [...new Set(list)];
}

type GenerateArgs = {
  apiKey: string;
  model: string;
  prompt: string;
  jsonMode?: boolean;
  temperature?: number;
};

export async function generateGeminiText(args: GenerateArgs): Promise<{
  text: string;
  model: string;
}> {
  const genAI = new GoogleGenerativeAI(args.apiKey);
  const models = uniqueModels(args.model);
  let lastError: Error | undefined;

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: args.prompt }] }],
        generationConfig: args.jsonMode
          ? {
              temperature: args.temperature ?? 0.35,
              responseMimeType: 'application/json',
            }
          : {
              temperature: args.temperature ?? 0.7,
            },
      });
      const text = result.response.text()?.trim() ?? '';
      if (!text) throw new Error('Empty Gemini response');
      return { text, model: modelName };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logger.warn(`Gemini model "${modelName}" failed: ${lastError.message}`);
    }
  }

  throw lastError ?? new Error('Gemini request failed');
}

export async function generateGeminiJson(
  args: GenerateArgs,
): Promise<{ parsed: Record<string, unknown>; model: string }> {
  const { text, model } = await generateGeminiText({ ...args, jsonMode: true });
  return { parsed: parseJsonObject(text), model };
}

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return {};
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
}
