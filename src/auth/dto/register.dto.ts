import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'أحمد محمد' })
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  @IsString()
  @MaxLength(100, { message: 'الاسم طويل جداً' })
  name: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;
}