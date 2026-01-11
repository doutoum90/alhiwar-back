import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class RejectUserDto {
  @ApiPropertyOptional({ example: "Profile incomplete", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  comment?: string;
}
