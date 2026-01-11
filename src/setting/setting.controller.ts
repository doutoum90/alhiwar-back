import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

import { SettingService } from "./setting.service";
import { UpdateEmailSettingsDto, UpdateSecuritySettingsDto, UpdateSystemSettingsDto } from "./dto/settings.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";


@ApiBearerAuth()
@Controller("settings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingController {
  constructor(private readonly settingsService: SettingService) { }

  @RequirePermissions("settings.view")
  @Get()
  async getAll() {
    return this.settingsService.getAll();
  }

  @RequirePermissions("settings.update")
  @Patch("/system")
  async updateSystem(@Body() dto: UpdateSystemSettingsDto) {
    return this.settingsService.updateSystem(dto);
  }

  @RequirePermissions("settings.update")
  @Patch("/email")
  async updateEmail(@Body() dto: UpdateEmailSettingsDto) {
    return this.settingsService.updateEmail(dto);
  }

  @RequirePermissions("settings.update")
  @Patch("/security")
  async updateSecurity(@Body() dto: UpdateSecuritySettingsDto) {
    return this.settingsService.updateSecurity(dto);
  }
}
