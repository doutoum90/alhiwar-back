import { Module } from '@nestjs/common';
import { SettingService } from './setting.service';
import { SettingController } from './setting.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from '../entities/api-key.entity';
import { AppSetting } from '../entities/app-setting.entity';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { DbAdminController } from './db-admin.controller';
import { DbAdminService } from './db-admin.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppSetting, ApiKey])],
  controllers: [SettingController, ApiKeysController, DbAdminController],
  providers: [SettingService, ApiKeysService, DbAdminService],
  exports: [SettingService, ApiKeysService, DbAdminService],
})
export class SettingModule {}
