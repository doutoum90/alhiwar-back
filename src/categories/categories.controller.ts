import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { RejectCategoryDto } from "./dto/reject-category.dto";
import { AuthUser } from "src/auth/auth.controller";

@ApiTags("Categories")
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }
  @ApiOperation({ summary: "Get published categories (public)" })
  @Get("published")
  getPublished() {
    return this.categoriesService.findPublished();
  }

  @ApiOperation({ summary: "Categories statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.stats.view")
  @Get("stats/summary")
  getStats() {
    return this.categoriesService.getStatistics();
  }

  @ApiOperation({ summary: "Categories review queue (in_review)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.review.view")
  @Get("review-queue")
  reviewQueue() {
    return this.categoriesService.getReviewQueue();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.view")
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  @ApiOperation({ summary: "Submit category for review (draft/rejected -> in_review)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.submit")
  @Post(":id/submit")
  submit(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.categoriesService.submit(id, me.userId);
  }

  @ApiOperation({ summary: "Approve category = publish (in_review -> published)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.review.approve")
  @Post(":id/approve")
  approve(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.categoriesService.approve(id, me.userId);
  }

  @ApiOperation({ summary: "Reject category (in_review -> rejected)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.review.reject")
  @Post(":id/reject")
  reject(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() me: AuthUser,
    @Body() dto: RejectCategoryDto
  ) {
    return this.categoriesService.reject(id, me.userId, dto.comment);
  }

  @ApiOperation({ summary: "Archive category (published -> archived)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.archive")
  @Post(":id/archive")
  archive(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() me: AuthUser) {
    return this.categoriesService.archive(id, me.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.create")
  @Post()
  create(@Body() dto: CreateCategoryDto, @CurrentUser() me: AuthUser) {
    return this.categoriesService.create(dto, me);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.view")
  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.categoriesService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.update")
  @Patch(":id")
  update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("categories.delete")
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.categoriesService.remove(id);
  }
}
