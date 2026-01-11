import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import type { ArticleStatus } from "../../entities/article.entity";

export class CreateArticleDto {
  @IsString() @MaxLength(220) title: string;
  @IsOptional() @IsString() excerpt?: string;
  @IsString() content: string;

  @IsUUID() categoryId: string;

  @IsOptional() @IsIn(["draft","published","archived"] as ArticleStatus[])
  status?: ArticleStatus;

  @IsOptional() @IsArray() tags?: string[];
}
