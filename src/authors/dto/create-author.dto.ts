import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user.entity';

export class CreateAuthorDto {
  @ApiProperty({ example: 'أحمد محمد' })
  @IsNotEmpty({ message: 'الاسم مطلوب' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ahmed@alhiwar.com' })
  @IsNotEmpty({ message: 'البريد الإلكتروني مطلوب' })
  @IsEmail({}, { message: 'البريد الإلكتروني غير صحيح' })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'كلمة المرور مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.AUTHOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'كاتب ومحرر في جريدة الحوار', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}