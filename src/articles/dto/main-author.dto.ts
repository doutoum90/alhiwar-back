// src/articles/dto/main-author.dto.ts
import { IsUUID } from "class-validator";

export class SetMainAuthorDto {
  @IsUUID()
  userId: string;
}
