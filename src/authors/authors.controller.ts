import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, ParseUUIDPipe,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger";

import { AuthorsService, PaginatedResult } from "./authors.service";
import { CreateAuthorDto } from "./dto/create-author.dto";
import { UpdateAuthorDto } from "./dto/update-author.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User, UserRole, UserStatus } from "../entities/user.entity";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";


@ApiTags("Authors")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("authors")
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) { }

  @RequirePermissions("authors.stats.view")
  @Get("stats/summary")
  getStats() {
    return this.authorsService.getStatistics();
  }

  @ApiOperation({ summary: "Get author by ID" })
  @RequirePermissions("authors.view")
  @Get(":id")
  @ApiParam({ name: "id", description: "Author ID (UUID)" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.authorsService.findOne(id);
  }

  @ApiOperation({ summary: "Create a new author" })
  @RequirePermissions("authors.create")
  @Post()
  create(@Body() dto: CreateAuthorDto) {
    return this.authorsService.create(dto);
  }

  @ApiOperation({ summary: "Get all authors" })
  @RequirePermissions("authors.view")
  @Get()
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "limit", required: false })
  @ApiQuery({ name: "role", required: false })
  @ApiQuery({ name: "status", required: false })
  @ApiQuery({ name: "search", required: false })
  findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("role") role?: UserRole,
    @Query("status") status?: UserStatus,
    @Query("search") search?: string,
  ): Promise<PaginatedResult<User>> {
    return this.authorsService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      role,
      status,
      search,
    });
  }

  @ApiOperation({ summary: "Update author" })
  @RequirePermissions("authors.update")
  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateAuthorDto) {
    return this.authorsService.update(id, dto);
  }

  @ApiOperation({ summary: "Change password" })
  @RequirePermissions("authors.password.change")
  @Patch(":id/change-password")
  changePassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: { oldPassword: string; newPassword: string },
  ) {
    return this.authorsService.changePassword(id, dto);
  }

  @ApiOperation({ summary: "Toggle author status" })
  @RequirePermissions("authors.status.toggle")
  @Patch(":id/toggle-status")
  toggleStatus(@Param("id", ParseUUIDPipe) id: string) {
    return this.authorsService.toggleStatus(id);
  }

  @ApiOperation({ summary: "Suspend author" })
  @RequirePermissions("authors.suspend")
  @Patch(":id/suspend")
  suspend(@Param("id", ParseUUIDPipe) id: string) {
    return this.authorsService.suspend(id);
  }

  @ApiOperation({ summary: "Activate author" })
  @RequirePermissions("authors.activate")
  @Patch(":id/activate")
  activate(@Param("id", ParseUUIDPipe) id: string) {
    return this.authorsService.activate(id);
  }

  @ApiOperation({ summary: "Delete author" })
  @RequirePermissions("authors.delete")
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.authorsService.remove(id);
  }
}
