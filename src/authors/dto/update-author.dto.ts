import { PartialType } from '@nestjs/swagger';
import { CreateAuthorDto } from './create-author.dto';
import { IsOptional } from 'class-validator';

export class UpdateAuthorDto extends PartialType(CreateAuthorDto) {
  @IsOptional()
  password?: string;
}