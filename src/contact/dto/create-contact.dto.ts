import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'أحمد محمد' })
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  @IsString()
  @MaxLength(100, { message: 'الاسم يجب أن يكون أقل من 100 حرف' })
  name: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  @MaxLength(150, { message: 'البريد الإلكتروني طويل جداً' })
  email: string;

  @ApiProperty({ example: 'رسالة الاتصال...' })
  @IsNotEmpty({ message: 'الرسالة مطلوبة' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'استفسار عام', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'الموضوع يجب أن يكون أقل من 50 حرف' })
  subject?: string;

  @ApiProperty({ example: '+235123456789', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'رقم الهاتف طويل جداً' })
  phone?: string;

  @ApiProperty({ example: 'شركة المثال', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'اسم الشركة طويل جداً' })
  company?: string;
}