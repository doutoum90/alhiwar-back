import {
  BadRequestException,
  Controller,
  UseGuards,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Get,
  Query,
  UploadedFile,
  UseInterceptors,
  Req,
} from "@nestjs/common";
import { Request } from "express";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";

import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";

import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";

import { ArticlesService } from "./articles.service";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";

import { ArticleMediaService } from "./article-media.service";
import { ArticleLikesService } from "./article-likes.service";
import { ArticleCommentsService } from "./article-comments.service";
import { ArticleAuthorsService } from "./article-authors.service";

import { AddMediaDto, ReorderMediaDto } from "./dto/media.dto";
import { CreateCommentDto, CreatePublicCommentDto, ModerateCommentDto } from "./dto/comments.dto";
import { UpdateAuthorsDto } from "./dto/authors.dto";
import { MediaType } from "../entities/article-media.entity";
import { SetMainAuthorDto } from "./dto/main-author.dto";
import { RejectArticleDto } from "./dto/reject-article.dto";
import { ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { AuthUser } from "src/auth/auth.controller";

const fileName = (_req: any, file: any, cb: any) => {
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  cb(null, `${unique}${extname(file.originalname)}`);
};
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
  "application/pdf",
]);
const fileFilter = (_req: any, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
  if (allowedMimeTypes.has(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new BadRequestException("Unsupported file type") as any, false);
};

// Order matters: keep static routes before UUID routes.
const UUID = "([0-9a-fA-F-]{36})";

@Controller("articles")
export class ArticlesController {
  constructor(
    private readonly articles: ArticlesService,
    private readonly media: ArticleMediaService,
    private readonly likes: ArticleLikesService,
    private readonly comments: ArticleCommentsService,
    private readonly authors: ArticleAuthorsService
  ) { }

  @ApiOperation({ summary: "Count articles in_review" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.stats.view")
  @Get("stats/in-review-count")
  inReviewCount() {
    return this.articles.getInReviewCount();
  }

  @ApiOperation({ summary: "Articles summary stats" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.stats.view")
  @Get("stats/summary")
  @ApiQuery({ name: "period", required: false, enum: ["7", "30", "90", "365"] })
  summary(@Query("period") period?: string) {
    return this.articles.getStatsSummary(period);
  }

  @Get("published")
  findPublished() {
    return this.articles.findPublished();
  }

  @Get("archived")
  findArchived() {
    return this.articles.findArchived();
  }

  @Get("slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.articles.findBySlug(slug);
  }

  @Get(`:id${UUID}/comments/public`)
  listCommentsPublic(
    @Param("id") articleId: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20"
  ) {
    return this.comments.listPublic(articleId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Post(`:id${UUID}/comments/public`)
  addCommentPublic(@Param("id") articleId: string, @Body() dto: CreatePublicCommentDto) {
    return this.comments.addPublic(articleId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.review.view")
  @Get("review-queue")
  reviewQueue() {
    return this.articles.getReviewQueue();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("comments.delete")
  @Delete("comments/:commentId")
  removeComment(@Param("commentId") commentId: string, @CurrentUser() user: AuthUser) {
    const isAdmin = (user?.permissions ?? []).includes("*");
    return this.comments.remove(commentId, user.userId, isAdmin);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("comments.moderate")
  @Patch("comments/:commentId/moderate")
  moderate(@Param("commentId") commentId: string, @Body() dto: ModerateCommentDto) {
    return this.comments.moderate(commentId, dto.status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("media.reorder")
  @Post("media/:mediaId/reorder")
  reorder(@Param("mediaId") mediaId: string, @Body() dto: ReorderMediaDto) {
    return this.media.reorder(mediaId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("media.delete")
  @Delete("media/:mediaId")
  removeMedia(@Param("mediaId") mediaId: string) {
    return this.media.remove(mediaId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.view")
  @Get(`:id${UUID}`)
  findOne(@Param("id") id: string) {
    return this.articles.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("media.view")
  @Get(`:id${UUID}/media`)
  listMedia(@Param("id") articleId: string) {
    return this.media.list(articleId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("comments.view")
  @Get(`:id${UUID}/comments`)
  listComments(
    @Param("id") articleId: string,
    @Query("page") page = "1",
    @Query("limit") limit = "20",
    @Query("status") status?: "visible" | "pending" | "hidden"
  ) {
    return this.comments.list(articleId, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      status,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("comments.create")
  @Post(`:id${UUID}/comments`)
  addComment(@Param("id") articleId: string, @CurrentUser() user: AuthUser, @Body() dto: CreateCommentDto) {
    return this.comments.add(articleId, user.userId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.view")
  @Get(`:id${UUID}/authors`)
  getAuthors(@Param("id") articleId: string) {
    return this.authors.getAuthors(articleId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.submit_review")
  @Post(`:id${UUID}/submit`)
  submit(@Param("id") id: string, @Req() req: Request) {
    return this.articles.submitForReview(id, (req as any).user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.review.approve")
  @Post(`:id${UUID}/approve`)
  approve(@Param("id") id: string, @Req() req: Request) {
    return this.articles.approve(id, (req as any).user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.review.reject")
  @Post(`:id${UUID}/reject`)
  reject(@Param("id") id: string, @Body() dto: RejectArticleDto, @Req() req: Request) {
    return this.articles.reject(id, dto.comment, (req as any).user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.view")
  @Get()
  findAllAdmin() {
    return this.articles.findAllAdmin();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.create")
  @Post()
  create(@Body() dto: CreateArticleDto, @CurrentUser() user: AuthUser) {
    return this.articles.create(dto, user.userId, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.update")
  @Patch(`:id${UUID}`)
  update(@Param("id") id: string, @Body() dto: UpdateArticleDto, @CurrentUser() user: AuthUser) {
    return this.articles.update(id, dto, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.publish")
  @Patch(`:id${UUID}/publish`)
  publish(@Param("id") id: string, @CurrentUser() user: AuthUser) {
    return this.articles.publish(id, user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.unpublish")
  @Patch(`:id${UUID}/unpublish`)
  unpublish(@Param("id") id: string) {
    return this.articles.unpublish(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.delete")
  @Delete(`:id${UUID}`)
  remove(@Param("id") id: string) {
    return this.articles.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.update")
  @Post(`:id${UUID}/authors`)
  setAuthors(@Param("id") articleId: string, @Body() dto: UpdateAuthorsDto) {
    return this.authors.setAuthors(articleId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("articles.update")
  @Patch(`:id${UUID}/main-author`)
  setMainAuthor(@Param("id") articleId: string, @Body() dto: SetMainAuthorDto) {
    return this.authors.setMainAuthor(articleId, dto.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("likes.toggle")
  @Post(`:id${UUID}/like`)
  toggleLike(@Param("id") articleId: string, @CurrentUser() user: AuthUser) {
    return this.likes.toggle(articleId, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("likes.view")
  @Get(`:id${UUID}/like`)
  isLiked(@Param("id") articleId: string, @CurrentUser() user: AuthUser) {
    return this.likes.isLiked(articleId, user.userId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("media.update")
  @Post(`:id${UUID}/media`)
  addMedia(@Param("id") articleId: string, @Body() dto: AddMediaDto) {
    return this.media.add(articleId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("media.upload")
  @Post(`:id${UUID}/media/upload`)
  @UseInterceptors(
    FileInterceptor("file", {
      storage: diskStorage({
        destination: "./uploads/articles",
        filename: fileName,
      }),
      fileFilter,
      limits: { fileSize: 50 * 1024 * 1024 },
    })
  )
  uploadMedia(
    @Param("id") articleId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body("type") type: MediaType,
    @Body("title") title?: string
  ) {
    const url = `/uploads/articles/${file.filename}`;
    return this.media.add(articleId, { type, url, title });
  }
}
