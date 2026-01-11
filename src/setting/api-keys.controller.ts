import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

import { ApiKeysService } from "./api-keys.service";
import { CreateApiKeyDto, UpdateApiKeyDto } from "./dto/settings.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";

@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("api-keys")
export class ApiKeysController {
  constructor(private readonly service: ApiKeysService) { }

  @RequirePermissions("api_keys.view")
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @RequirePermissions("api_keys.create")
  @Post()
  async create(@Body() dto: CreateApiKeyDto) {
    return this.service.create(dto);
  }

  @RequirePermissions("api_keys.update")
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateApiKeyDto) {
    return this.service.update(id, dto);
  }

  @RequirePermissions("api_keys.update")
  @Patch(":id/toggle")
  toggle(@Param("id") id: string) {
    return this.service.toggle(id);
  }

  @RequirePermissions("api_keys.delete")
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
