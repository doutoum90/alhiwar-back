import { IsUUID } from "class-validator";

export class SetMainAuthorDto {
  @IsUUID()
  userId: string;
}
