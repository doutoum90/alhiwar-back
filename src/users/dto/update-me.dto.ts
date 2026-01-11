import { IsOptional, IsString, IsUrl, ValidateIf } from "class-validator";

export class UpdateMeDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional() @IsString()
  username?: string;

  @IsOptional() @IsString()
  bio?: string | null;

  @IsOptional() @IsString()
  phone?: string | null;

  @IsOptional() @IsString()
  location?: string | null;

  @ValidateIf((o) => o.website !== null)
  @IsOptional() @IsUrl()
  website?: string | null;

  @IsOptional() @IsString()
  company?: string | null;

  @ValidateIf((o) => o.avatar !== null)
  @IsOptional() @IsUrl()
  avatar?: string | null;
}
