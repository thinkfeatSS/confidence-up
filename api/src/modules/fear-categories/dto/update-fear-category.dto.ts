import { PartialType } from '@nestjs/mapped-types';
import { CreateFearCategoryDto } from './create-fear-category.dto';

export class UpdateFearCategoryDto extends PartialType(CreateFearCategoryDto) {}
