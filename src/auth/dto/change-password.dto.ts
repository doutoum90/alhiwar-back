import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'oldpassword123' })
  @IsNotEmpty({ message: 'Ancien mot de passe requis' })
  oldPassword: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsNotEmpty({ message: 'Nouveau mot de passe requis' })
  @MinLength(6, { message: 'Le nouveau mot de passe doit contenir au moins 6 caracteres' })
  newPassword: string;
}
