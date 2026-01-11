import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class RejectCategoryDto {
  @ApiPropertyOptional({ example: "Not relevant", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
