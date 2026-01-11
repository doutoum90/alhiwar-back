// src/rbac/rbac.controller.ts
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { RbacService } from "./rbac.service";
import { AssignRolePermissionsDto } from "./dto/assign-role-permissions.dto"
import { AssignUserRolesDto } from "./dto/assign-user-roles.dto"



@ApiTags("RBAC")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("admin/rbac")
export class RbacController {
  constructor(private readonly rbac: RbacService) { }

  /* ================= LIST ================= */

  @RequirePermissions("rbac.roles.view")
  @Get("roles")
  roles() {
    return this.rbac.listRoles();
  }

  @RequirePermissions("rbac.permissions.view")
  @Get("permissions")
  permissions() {
    return this.rbac.listPermissions();
  }

  /* ================= ROLE → PERMISSIONS ================= */

  @RequirePermissions("rbac.roles.view")
  @Get("roles/:roleId/permissions")
  rolePermissions(@Param("roleId", ParseUUIDPipe) roleId: string) {
    return this.rbac.getRolePermissions(roleId);
  }

  // ✅ ASSIGN/REPLACE (checkbox UI)
  @RequirePermissions("rbac.permissions.assign")
  @Post("roles/:roleId/permissions")
  assignRolePermissions(
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    console.log('dto.permissionKeys --->', dto.permissionKeys)
    if (!Array.isArray(dto.permissionKeys)) {
      throw new BadRequestException("permissionKeys must be an array");
    }
    return this.rbac.assignRolePermissions(roleId, dto.permissionKeys ?? []);
  }

  @RequirePermissions("rbac.permissions.assign")
  @Delete("roles/:roleId/permissions/:permissionId")
  removeRolePermission(
    @Param("roleId", ParseUUIDPipe) roleId: string,
    @Param("permissionId", ParseUUIDPipe) permissionId: string,
  ) {
    return this.rbac.removeRolePermission(roleId, permissionId);
  }

  /* ================= USER → ROLES ================= */

  @RequirePermissions("rbac.users.assign_roles")
  @Get("users/:userId/roles")
  userRoles(@Param("userId", ParseUUIDPipe) userId: string) {
    return this.rbac.getUserRoles(userId);
  }

  // ✅ ASSIGN/REPLACE
  @RequirePermissions("rbac.users.assign_roles")
  @Post("users/:userId/roles")
  assignUserRoles(
    @Param("userId", ParseUUIDPipe) userId: string,
    @Body() dto: AssignUserRolesDto,
  ) {
    return this.rbac.assignUserRoles(userId, dto.roleKeys ?? []);
  }
}
