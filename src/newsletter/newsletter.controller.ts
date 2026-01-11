import { Body, Controller, Delete, Get, Patch, Post, Query, Param, UseGuards, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";

import { NewsletterService } from "./newsletter.service";
import { SubscribeNewsletterDto } from "./dto/subscribe-newsletter.dto";
import { AdminUpdateNewsletterDto } from "./dto/admin-update-newsletter.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";


@ApiTags("Newsletter")
@Controller("newsletter")
export class NewsletterController {
  constructor(private readonly service: NewsletterService) { }

  @ApiOperation({ summary: "Newsletter statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("newsletter.stats.view")
  @Get("stats/summary")
  stats() {
    return this.service.getStatistics();
  }

  // ===== PUBLIC =====

  @ApiOperation({ summary: "Subscribe (double opt-in)" })
  @Post("subscribe")
  subscribe(@Body() dto: SubscribeNewsletterDto) {
    return this.service.subscribe(dto);
  }

  @ApiOperation({ summary: "Verify subscription by token" })
  @Get("verify")
  @ApiQuery({ name: "token", required: true })
  verify(@Query("token") token: string) {
    return this.service.verify(token);
  }

  @ApiOperation({ summary: "Unsubscribe (public)" })
  @Post("unsubscribe")
  unsubscribe(@Body() body: { token?: string; email?: string }) {
    if (body?.token) return this.service.unsubscribeByToken(body.token);
    if (body?.email) return this.service.unsubscribeByEmail(body.email);
    throw new BadRequestException("token or email is required");
  }

  // ===== ADMIN =====

  @ApiOperation({ summary: "Admin list newsletter subscriptions" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("newsletter.view")
  @Get("admin")
  adminList(
    @Query("q") q?: string,
    @Query("status") status?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.service.adminList({
      q,
      status,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
  }

  @ApiOperation({ summary: "Admin update subscription" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("newsletter.update")
  @Patch("admin/:id")
  adminUpdate(@Param("id") id: string, @Body() dto: AdminUpdateNewsletterDto) {
    return this.service.adminUpdate(id, dto);
  }

  @ApiOperation({ summary: "Admin remove subscription" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("newsletter.delete")
  @Delete("admin/:id")
  adminRemove(@Param("id") id: string) {
    return this.service.adminRemove(id);
  }
}
