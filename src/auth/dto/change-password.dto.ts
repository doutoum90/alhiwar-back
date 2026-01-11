import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword123' })
  @IsNotEmpty({ message: 'كلمة المرور القديمة مطلوبة' })
  oldPassword: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsNotEmpty({ message: 'كلمة المرور الجديدة مطلوبة' })
  @MinLength(6, { message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' })
  newPassword: string;
}
