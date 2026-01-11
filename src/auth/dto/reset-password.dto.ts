import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-123' })
  @IsNotEmpty({ message: 'Le token de reinitialisation est requis' })
  token: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsNotEmpty({ message: 'Le nouveau mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caracteres' })
  newPassword: string;
}
