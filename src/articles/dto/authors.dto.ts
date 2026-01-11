import { IsArray, IsUUID } from "class-validator";

export class UpdateAuthorsDto {
  @IsArray()
  @IsUUID("4", { each: true })
  authorIds: string[];
}
