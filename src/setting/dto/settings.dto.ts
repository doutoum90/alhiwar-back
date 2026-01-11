import { IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUrl, Max, Min, ArrayUnique } from "class-validator";
import { Type } from "class-transformer";

export class UpdateSystemSettingsDto {
  @IsOptional() @IsString()
  siteName?: string;

  @IsOptional() @IsString()
  siteDescription?: string;

  @IsOptional() @IsUrl({ require_tld: false })
  siteUrl?: string;

  @IsOptional() @IsEmail()
  adminEmail?: string;

  @IsOptional() @IsString()
  timezone?: string;

  @IsOptional() @IsString()
  language?: string;

  @IsOptional() @IsBoolean()
  maintenanceMode?: boolean;

  @IsOptional() @IsBoolean()
  registrationEnabled?: boolean;

  @IsOptional() @IsBoolean()
  commentsEnabled?: boolean;

  @IsOptional() @IsBoolean()
  emailVerificationRequired?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500)
  maxFileSize?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  articlesPerPage?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10080)
  sessionTimeout?: number;
}

export class UpdateEmailSettingsDto {
  @IsOptional() @IsString()
  smtpHost?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(65535)
  smtpPort?: number;

  @IsOptional() @IsString()
  smtpUser?: string;

  @IsOptional() @IsString()
  smtpPassword?: string;

  @IsOptional() @IsString()
  senderName?: string;

  @IsOptional() @IsEmail()
  senderEmail?: string;

  @IsOptional() @IsBoolean()
  enableSSL?: boolean;
}

export class UpdateSecuritySettingsDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(6) @Max(64)
  passwordMinLength?: number;

  @IsOptional() @IsBoolean()
  requireSpecialChars?: boolean;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(168)
  sessionDuration?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(20)
  maxLoginAttempts?: number;

  @IsOptional() @IsBoolean()
  twoFactorEnabled?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  ipWhitelist?: string[];
}

export class CreateApiKeyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[];
}

export class UpdateApiKeyDto {
  @IsOptional() @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional() @IsBoolean()
  isActive?: boolean;
}

export {};
