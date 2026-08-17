import {

  IsArray,

  IsNumber,

  IsObject,

  IsOptional,

  IsString,

  Max,

  Min,

} from 'class-validator';



export class CreateSpeechSessionDto {

  @IsString() transcript: string;

  @IsOptional() @IsString() topic?: string;

  @IsOptional() @IsString() languageDetected?: string;

  @IsNumber() wordCount: number;

  @IsOptional() @IsNumber() sentenceCount?: number;

  @IsNumber() fillerCount: number;

  @IsNumber() vocabularyRichness: number;

  @IsOptional() @IsNumber() repetitionScore?: number;

  @IsNumber() averageVolume: number;

  @IsOptional() @IsNumber() pauseFrequency?: number;

  @IsNumber() speechSpeedWpm: number;

  @IsNumber() fluencyScore: number;

  @IsNumber() topicRelevanceScore: number;

  @IsNumber() @Min(0) @Max(100) overallConfidenceScore: number;

  @IsNumber() durationSeconds: number;

  @IsOptional() @IsNumber() @Min(0) xpEarned?: number;

  @IsOptional() @IsObject() languageMix?: Record<string, unknown>;

  @IsOptional() @IsObject() confidenceComponents?: Record<string, unknown>;

  @IsOptional() @IsObject() localMetrics?: Record<string, unknown>;

  @IsOptional() @IsObject() aiInsights?: Record<string, unknown>;

  @IsOptional() @IsObject() fillerBreakdown?: Record<string, unknown>;

  @IsOptional() @IsArray() @IsString({ each: true }) coachingFeedback?: string[];

  @IsOptional() @IsArray() @IsString({ each: true }) personalizedSuggestions?: string[];

  @IsOptional() @IsString() miniMission?: string;

  @IsOptional() @IsObject() analysisMeta?: Record<string, unknown>;

  @IsOptional() @IsString() missionId?: string;

  @IsOptional() @IsString() challengeId?: string;

}


