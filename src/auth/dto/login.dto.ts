import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: "L'email est invalide" })
  @IsNotEmpty({ message: "L'email est requis" })
  email: string;

  @IsString({ message: 'Le mot de passe doit etre une chaine' })
  @IsNotEmpty({ message: 'Le mot de passe est requis' })
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caracteres' })
  password: string;
}
