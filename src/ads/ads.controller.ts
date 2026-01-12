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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger";

import { AdsService } from "./ads.service";
import { CreateAdDto } from "./dto/create-ad.dto";
import { UpdateAdDto } from "./dto/update-ad.dto";
import { RejectAdDto } from "./dto/reject-ad.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { AdType } from "../entities/ad.entity";
import { AuthUser } from "src/auth/auth.controller";

@ApiTags("Ads")
@Controller("ads")
export class AdsController {
  constructor(private readonly adsService: AdsService) { }

  /* ======================= PUBLIC / PUBLISHED (STATIC FIRST) ======================= */

  @ApiOperation({ summary: "Get published ads (public)" })
  @Get("published")
  findPublished() {
    return this.adsService.findPublishedActive();
  }

  @ApiOperation({ summary: "Get published ads by placementKey (public)" })
  @Get("placement")
  @ApiQuery({ name: "key", required: true })
  findPublishedByPlacement(@Query("key") key: string) {
    return this.adsService.findPublishedByPlacementKey(String(key || "").trim());
  }

  @ApiOperation({ summary: "Get published ads by type (public)" })
  @Get("type/:type")
  @ApiParam({ name: "type", enum: AdType })
  findPublishedByType(@Param("type") type: AdType) {
    return this.adsService.findPublishedByType(type);
  }

  /* ======================= WORKFLOW (STATIC FIRST) ======================= */

  @ApiOperation({ summary: "Review queue (in_review)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.review.view")
  @Get("review-queue")
  reviewQueue() {
    return this.adsService.getReviewQueue();
  }

  /* ======================= STATS (STATIC FIRST) ======================= */

  @ApiOperation({ summary: "Get ads statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.stats.view")
  @Get("stats/summary")
  getStatistics() {
    return this.adsService.getStatistics();
  }

  @ApiOperation({ summary: "Get ads grouped by type with stats" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.stats.view")
  @Get("stats/by-type")
  getAdsByType() {
    return this.adsService.getAdsByType();
  }

  @ApiOperation({ summary: "Get top performing ads" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.stats.view")
  @Get("stats/top")
  @ApiQuery({ name: "limit", required: false })
  getTopPerformingAds(@Query("limit") limit?: string) {
    return this.adsService.getTopPerformingAds(limit ? parseInt(limit, 10) : 10);
  }

  /* ======================= ADMIN LIST ======================= */

  @ApiOperation({ summary: "Get all ads (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.view")
  @Get()
  findAll() {
    return this.adsService.findAll();
  }

  /* ======================= CREATE / UPDATE / DELETE ======================= */

  @ApiOperation({ summary: "Create a new ad (starts as draft)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.create")
  @Post()
  create(@Body() dto: CreateAdDto, @CurrentUser() me: AuthUser) {
    return this.adsService.create(dto, me.userId);
  }

  @ApiOperation({ summary: "Update ad fields (no status change here)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.update")
  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateAdDto) {
    return this.adsService.update(id, dto);
  }

  @ApiOperation({ summary: "Delete ad" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.delete")
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.adsService.remove(id);
  }

  /* ======================= WORKFLOW (ID ROUTES) ======================= */

  @ApiOperation({ summary: "Submit ad for review (draft/rejected -> in_review)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.submit")
  @Post(":id/submit")
  submit(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.adsService.submit(id, me.userId);
  }

  @ApiOperation({ summary: "Approve ad = publish (in_review -> published)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.review.approve")
  @Post(":id/approve")
  approve(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.adsService.approve(id, me.userId);
  }

  @ApiOperation({ summary: "Reject ad (in_review -> rejected)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.review.reject")
  @Post(":id/reject")
  reject(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() me: AuthUser,
    @Body() dto: RejectAdDto
  ) {
    return this.adsService.reject(id, me.userId, dto.comment);
  }

  @ApiOperation({ summary: "Archive ad (published -> archived)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.archive")
  @Post(":id/archive")
  archive(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.adsService.archive(id, me.userId);
  }

  /* ======================= TRACKING ======================= */

  @ApiOperation({ summary: "Record ad click (public)" })
  @Post(":id/click")
  recordClick(@Param("id", ParseUUIDPipe) id: string) {
    return this.adsService.recordClick(id);
  }

  @ApiOperation({ summary: "Record ad impression (public)" })
  @Post(":id/impression")
  recordImpression(@Param("id", ParseUUIDPipe) id: string) {
    return this.adsService.recordImpression(id);
  }

  /* ======================= ITEM (UUID SAFE) ======================= */
  /**
   * IMPORTANT:
   * We DO NOT use @Get(":id") here anymore, to avoid collisions with /ads/placements, /ads/stats, etc.
   */
  @ApiOperation({ summary: "Get ad by ID (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("ads.view")
  @Get("by-id/:id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.adsService.findOne(id);
  }
}
