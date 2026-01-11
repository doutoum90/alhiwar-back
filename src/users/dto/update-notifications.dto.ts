import { IsBoolean } from 'class-validator';

export class UpdateNotificationsDto {
  @IsBoolean()
  email: boolean;

  @IsBoolean()
  push: boolean;

  @IsBoolean()
  newsletter: boolean;
}
