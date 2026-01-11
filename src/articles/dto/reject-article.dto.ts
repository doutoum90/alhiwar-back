// dto/reject-article.dto.ts
import { IsNotEmpty, IsString } from "class-validator";

export class RejectArticleDto {
  @IsNotEmpty()
  @IsString()
  comment: string;
}
