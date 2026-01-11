import { IsNotEmpty, IsString, IsEmail, IsOptional, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContactDto {
  @ApiProperty({ example: 'Jean Dupont' })
  @IsNotEmpty({ message: 'Le nom est requis' })
  @IsString()
  @MaxLength(100, { message: 'Le nom doit contenir moins de 100 caracteres' })
  name: string;

  @ApiProperty({ example: 'ahmed@example.com' })
  @IsNotEmpty({ message: "L'email est requis" })
  @IsEmail({}, { message: "L'email est invalide" })
  @MaxLength(150, { message: "L'email est trop long" })
  email: string;

  @ApiProperty({ example: 'Message de contact...' })
  @IsNotEmpty({ message: 'Le message est requis' })
  @IsString()
  message: string;

  @ApiProperty({ example: 'Demande generale', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Le sujet doit contenir moins de 50 caracteres' })
  subject?: string;

  @ApiProperty({ example: '+235123456789', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20, { message: 'Le numero de telephone est trop long' })
  phone?: string;

  @ApiProperty({ example: 'Exemple SARL', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Le nom de la societe est trop long' })
  company?: string;
}
