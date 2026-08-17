import { PartialType } from '@nestjs/mapped-types';
import { CreateSkillNodeDto } from './create-skill-node.dto';

export class UpdateSkillNodeDto extends PartialType(CreateSkillNodeDto) {}
