import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;
}

export class CreatePublicCommentDto {
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(180)
  email?: string;
}

export class ModerateCommentDto {
  @IsIn(["visible", "pending", "hidden"])
  status: "visible" | "pending" | "hidden";
}
