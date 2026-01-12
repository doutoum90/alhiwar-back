import { IsNotEmpty, IsString, IsOptional, IsEnum, IsDateString, IsUrl, MaxLength, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AdType } from "../../entities/ad.entity";
import { Transform } from "class-transformer";

export class CreateAdDto {
  @ApiProperty({ example: "Ad title" })
  @IsNotEmpty({ message: "Title is required" })
  @IsString()
  title: string;

  @ApiProperty({ example: "Ad content..." })
  @IsNotEmpty({ message: "Content is required" })
  @IsString()
  content: string;

  @ApiProperty({
    example: "https://example.com/ad-image.jpg",
    required: false,
    description: "Ad image URL",
  })
  @IsOptional()
  @IsUrl({}, { message: "Invalid image URL" })
  image?: string | null;

  @ApiProperty({
    example: "https://example.com",
    required: false,
    description: "Target URL when clicking the ad",
  })
  @IsOptional()
  @IsUrl({}, { message: "Invalid link URL" })
  link?: string | null;

  @ApiProperty({
    enum: AdType,
    default: AdType.BANNER,
    description: "Ad type",
  })
  @IsOptional()
  @IsEnum(AdType, { message: "Invalid ad type" })
  type?: AdType;

  @ApiProperty({
    example: "2024-01-01T00:00:00.000Z",
    required: false,
    description: "Start date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString({}, { message: "Invalid startDate" })
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  startDate?: string | null;

  @ApiProperty({
    example: "2024-12-31T23:59:59.999Z",
    required: false,
    description: "End date (ISO 8601)",
  })
  @IsOptional()
  @IsDateString({}, { message: "Invalid endDate" })
  @Transform(({ value }) => (value ? new Date(value).toISOString() : null))
  endDate?: string | null;

  @ApiProperty({
    required: false,
    example: "home_sidebar_top",
    description: "Optional placement key to target a specific slot",
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  @Matches(/^[a-z0-9_]+$/, { message: "placementKey must be lowercase letters/numbers/underscore" })
  placementKey?: string | null;
}
