import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class CreateJournalEntryDto {
  @IsString() title: string;
  @IsString() body: string;
  @IsNumber() @Min(1) @Max(5) mood: number;
  @IsOptional() @IsString() reflectionPrompt?: string;
}
