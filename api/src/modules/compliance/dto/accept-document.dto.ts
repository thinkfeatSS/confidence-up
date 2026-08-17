import { IsEnum, IsString } from 'class-validator';
import { DocumentType } from '@prisma/client';

export class AcceptDocumentDto {
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @IsString()
  version: string;
}
