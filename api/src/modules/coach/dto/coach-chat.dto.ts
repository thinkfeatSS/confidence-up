import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChatMessageDto {
  @IsString()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  content: string;
}

class CoachContextDto {
  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  streak?: number;

  @IsOptional()
  confidenceScore?: number;

  @IsOptional()
  lastSessionScore?: number;
}

export class CoachChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages: ChatMessageDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CoachContextDto)
  context?: CoachContextDto;
}
