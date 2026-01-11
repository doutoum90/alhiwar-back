import { IsNotEmpty, IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../entities/user.entity';

export class CreateAuthorDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ahmed@alhiwar.com' })
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: "L'email est invalide" })
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caracteres' })
  password: string;

  @ApiProperty({ enum: UserRole, default: UserRole.AUTHOR })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', required: false })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 'Auteur et editeur', required: false })
  @IsOptional()
  @IsString()
  bio?: string;
}
