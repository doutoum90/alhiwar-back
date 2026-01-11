import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-123' })
  @IsNotEmpty({ message: 'رمز إعادة التعيين مطلوب' })
  token: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' })
  newPassword: string;
}