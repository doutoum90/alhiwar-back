import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@alhiwar.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email: string;
}