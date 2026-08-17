import { IsArray, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class AnalyzeSpeechAiDto {
  @IsString() transcript: string;
  @IsString() topic: string;
  @IsOptional() @IsString() languageDetected?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) preferredLanguages?: string[];
  @IsOptional() @IsObject() nlpSummary?: Record<string, unknown>;
  @IsOptional() @IsObject() audioSummary?: Record<string, unknown>;
  @IsOptional() @IsObject() languageSummary?: Record<string, unknown>;
  @IsOptional() @IsObject() structuredPayload?: Record<string, unknown>;
  @IsOptional() @IsNumber() localLanguageConfidence?: number;
}
