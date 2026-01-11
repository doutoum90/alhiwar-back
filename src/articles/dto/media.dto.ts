import { IsEnum, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from "class-validator";
import { MediaType } from "../../entities/article-media.entity";

export class AddMediaDto {
  @IsEnum(MediaType)
  type: MediaType;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;


  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}

export class ReorderMediaDto {
  @IsInt()
  @Min(0)
  position: number;
}
