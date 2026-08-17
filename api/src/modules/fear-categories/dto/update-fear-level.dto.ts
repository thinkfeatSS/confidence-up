import { PartialType } from '@nestjs/mapped-types';
import { CreateFearLevelDto } from './create-fear-level.dto';

export class UpdateFearLevelDto extends PartialType(CreateFearLevelDto) {}
