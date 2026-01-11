import { IsEmail, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class SubscribeNewsletterDto {
  @ApiProperty({ example: "contact@alhiwar.td" })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
