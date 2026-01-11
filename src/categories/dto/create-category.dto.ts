import { ApiProperty } from "@nestjs/swagger";
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateCategoryDto {
  @ApiProperty({ example: "Politics" })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: "politics", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  slug?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  image?: string | null;

  @ApiProperty({ required: false, example: "#FF0000" })
  @IsOptional()
  @IsString()
  @MaxLength(7)
  color?: string | null;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
