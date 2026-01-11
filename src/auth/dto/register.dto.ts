import { IsEmail, IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  @MaxLength(100, { message: 'Le nom est trop long' })
  name: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail({}, { message: "L'email est invalide" })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères' })
  password: string;
}
