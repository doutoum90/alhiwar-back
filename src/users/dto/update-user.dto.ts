import { IsOptional, IsString, IsUrl, MaxLength, Matches } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @Matches(/^[a-zA-Z0-9._-]+$/, { message: 'username invalide' })
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: 'website doit être une URL valide' })
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  company?: string;
}
