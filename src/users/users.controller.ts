import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { RejectUserDto } from "./dto/reject-user.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { UpdateMeDto } from "./dto/update-me.dto";
import { UpdateNotificationsDto } from "./dto/update-notifications.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { SearchUsersDto } from "./dto/search-users.dto";

import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { AuthUser } from "src/auth/auth.controller";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  /* ======================= STATS ======================= */

  @ApiOperation({ summary: "Users statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.stats.view")
  @Get("stats/summary")
  @ApiQuery({ name: "period", required: false, enum: ["7", "30", "90", "365"] })
  stats(@Query("period") period?: string) {
    return this.usersService.getStatistics(period);
  }

  /* ================== PROFILE (ME) ================== */

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.userId);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("me")
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(user.userId, dto);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("me/notifications")
  updateNotifications(@CurrentUser() user: AuthUser, @Body() dto: UpdateNotificationsDto) {
    return this.usersService.updateNotifications(user.userId, dto);
  }
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("me/password")
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(user.userId, dto.currentPassword, dto.newPassword);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete("me")
  deleteMe(@CurrentUser() user: AuthUser) {
    return this.usersService.remove(user.userId);
  }

  /* ================== LIST/SEARCH ================== */

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.view")
  @Get()
  listOrSearch(@Query() q: SearchUsersDto) {
    if (q.search && q.search.trim().length > 0) return this.usersService.searchUsers(q);
    return this.usersService.findAll();
  }

  /* ================== WORKFLOW (ADMIN) ================== */

  @ApiOperation({ summary: "Users review queue (in_review)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.review.view")
  @Get("admin/review-queue")
  reviewQueue() {
    return this.usersService.getReviewQueue();
  }

  @ApiOperation({ summary: "Submit user for review (draft/rejected -> in_review)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.submit")
  @Post("admin/:id/submit")
  submit(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.usersService.submit(id, me.userId);
  }

  @ApiOperation({ summary: "Approve user = publish (in_review -> published)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.review.approve")
  @Post("admin/:id/approve")
  approve(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.usersService.approve(id, me.userId);
  }

  @ApiOperation({ summary: "Reject user (in_review -> rejected)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.review.reject")
  @Post("admin/:id/reject")
  reject(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() me: AuthUser,
    @Body() dto: RejectUserDto
  ) {
    return this.usersService.reject(id, me.userId, dto.comment);
  }

  @ApiOperation({ summary: "Archive user (published -> archived)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.archive")
  @Post("admin/:id/archive")
  archive(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.usersService.archive(id, me.userId);
  }

  /* ================== ADMIN CRUD ================== */

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.create")
  @Post("admin")
  create(@Body() dto: CreateUserDto, @CurrentUser() me: AuthUser) {
    return this.usersService.createWithWorkflow(dto as any, me);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.view")
  @Get("admin/:id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.findOneOrFail(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.update")
  @Patch("admin/:id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("users.delete")
  @Delete("admin/:id")
  removeAdmin(@Param("id", ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }
}
