import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThanOrEqual } from "typeorm";
import { Article, ArticleStatus } from "../entities/article.entity";
import { Category } from "../entities/category.entity";
import { CreateArticleDto } from "./dto/create-article.dto";
import { UpdateArticleDto } from "./dto/update-article.dto";
import { UserRole } from "../entities/user.entity";
import { cutoffFromPeriod } from "src/stats/period";
import { AuthUser } from "src/auth/auth.controller";


@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article) private readonly repo: Repository<Article>,
    @InjectRepository(Category) private readonly catRepo: Repository<Category>
  ) { }

  async getInReviewCount(): Promise<{ count: number }> {
    const count = await this.repo.count({ where: { status: "in_review" as any } });
    return { count };
  }



  async getStatsSummary(period?: string) {
    const cutoff = cutoffFromPeriod(period);

    const totalArticles = await this.repo.count();

    const publishedArticles = await this.repo.count({ where: { status: "published" } });
    const inReviewArticles = await this.repo.count({ where: { status: "in_review" } });
    const draftArticles = await this.repo.count({ where: { status: "draft" } });

    const totalViewsRow = await this.repo
      .createQueryBuilder("a")
      .select('COALESCE(SUM(a.views), 0)::bigint', "sum")
      .getRawOne<{ sum: string }>();

    const totalLikesRow = await this.repo
      .createQueryBuilder("a")
      .select('COALESCE(SUM(a."likesCount"), 0)::bigint', "sum")
      .getRawOne<{ sum: string }>();

    const totalCommentsRow = await this.repo
      .createQueryBuilder("a")
      .select('COALESCE(SUM(a."commentsCount"), 0)::bigint', "sum")
      .getRawOne<{ sum: string }>();

    // ✅ IMPORTANT: pas de "=" sur une date, on filtre la période
    const newArticlesInPeriod = await this.repo.count({
      where: { createdAt: MoreThanOrEqual(cutoff) },
    });

    return {
      totalArticles,
      publishedArticles,
      inReviewArticles,
      draftArticles,
      totalViews: Number(totalViewsRow?.sum ?? 0),
      totalLikes: Number(totalLikesRow?.sum ?? 0),
      totalComments: Number(totalCommentsRow?.sum ?? 0),
      newArticlesInPeriod,
    };
  }



  private isEditor(role?: UserRole) {
    return role === UserRole.ADMIN || role === UserRole.EDITOR_IN_CHIEF;
  }

  private getUserId(user: any): string | null {
    return user?.id ?? user?.userId ?? null;
  }

  async create(dto: CreateArticleDto, authorId: string, user?: AuthUser) {
    if (!authorId) throw new BadRequestException("Author not identified");

    const category = await this.catRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException("Category not found");

    const slug = this.generateSlug(dto.title);

    const editor = this.isEditor(user?.role);

    // ✅ Strict: journalist/author always draft
    const status: ArticleStatus = editor
      ? ((dto.status as ArticleStatus) ?? "draft")
      : "draft";

    const entity = this.repo.create({
      title: dto.title,
      excerpt: dto.excerpt ?? null,
      content: dto.content,
      slug,
      status,
      authorId,
      categoryId: dto.categoryId,
      tags: dto.tags ?? [],
      publishedAt: status === "published" ? new Date() : null,

      // workflow fields
      submittedAt: null,
      submittedById: null,
      reviewedAt: null,
      reviewedById: null,
      reviewComment: null,
    });

    return this.repo.save(entity);
  }

  async findAllAdmin() {
    return this.repo.find({
      relations: ["author", "category"],
      order: { createdAt: "DESC" },
    });
  }

  async findPublished() {
    return this.repo.find({
      where: { status: "published" },
      relations: ["author", "category"],
      order: { publishedAt: "DESC" },
    });
  }

  async findArchived() {
    return this.repo.find({
      where: { status: "archived" },
      relations: ["author", "category"],
      order: { updatedAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const a = await this.repo.findOne({
      where: { id },
      relations: ["author", "category", "authors", "authors.user", "media"],
    });
    if (!a) throw new NotFoundException("Article not found");
    return a;
  }

  async findBySlug(slug: string) {
    const a = await this.repo.findOne({
      where: { slug },
      relations: ["author", "category", "authors", "authors.user", "media"],
    });
    if (!a) throw new NotFoundException("Article not found");

    await this.repo.increment({ id: a.id }, "views", 1);
    a.views += 1;
    return a;
  }

  async update(id: string, dto: UpdateArticleDto, user?: AuthUser) {
    const a = await this.findOne(id);

    const editor = this.isEditor(user?.role);
    const userId = this.getUserId(user);

    // ✅ ownership check (non-admin non-editor)
    if (!editor && user?.role !== UserRole.ADMIN) {
      if (a.authorId !== userId) {
        throw new ForbiddenException("You can only edit your own articles.");
      }
    }

    // ✅ journalist/author cannot publish via update
    if (!editor && dto.status === "published") {
      throw new ForbiddenException("Publishing requires editor approval.");
    }

    // ✅ journalist/author cannot edit when in_review or published (recommended)
    if (!editor && ["in_review", "published"].includes(a.status)) {
      throw new ForbiddenException("This article cannot be edited in its current state.");
    }

    if (dto.title && dto.title !== a.title) a.slug = this.generateSlug(dto.title);

    // status transitions (editor only for publish)
    if (dto.status && dto.status !== a.status) {
      if (dto.status === "published" && !editor) {
        throw new ForbiddenException("Publishing requires editor approval.");
      }
      if (dto.status === "published") a.publishedAt = new Date();
      if (dto.status !== "published") a.publishedAt = null;
    }

    Object.assign(a, dto);
    return this.repo.save(a);
  }

  async publish(id: string, user?: AuthUser) {
    if (!this.isEditor(user?.role)) {
      throw new ForbiddenException("Publishing requires editor privileges.");
    }
    const a = await this.findOne(id);
    a.status = "published";
    a.publishedAt = new Date();
    return this.repo.save(a);
  }

  async unpublish(id: string) {
    const a = await this.findOne(id);
    a.status = "draft";
    a.publishedAt = null;
    return this.repo.save(a);
  }

  async remove(id: string) {
    const a = await this.findOne(id);
    await this.repo.remove(a);
    return { ok: true };
  }

  /* ================= Review workflow ================= */

  async submitForReview(articleId: string, user: any) {
    const a = await this.findOne(articleId);

    const userId = this.getUserId(user);
    const editor = this.isEditor(user?.role);

    // ✅ allow editor/admin or owner
    if (!editor && user?.role !== UserRole.ADMIN && a.authorId !== userId) {
      throw new ForbiddenException("You can only submit your own articles.");
    }

    if (!["draft", "rejected"].includes(a.status)) {
      throw new BadRequestException("This article cannot be submitted.");
    }

    a.status = "in_review";
    a.submittedAt = new Date();
    a.submittedById = userId;

    return this.repo.save(a);
  }

  async getReviewQueue() {
    return this.repo.find({
      where: { status: "in_review" as any },
      relations: ["author", "category"],
      order: { updatedAt: "DESC" },
    });
  }

  async approve(articleId: string, reviewer: any) {
    if (!this.isEditor(reviewer?.role)) {
      throw new ForbiddenException("Approval requires editor privileges.");
    }

    const a = await this.findOne(articleId);
    if (a.status !== "in_review") {
      throw new BadRequestException("This article is not in review.");
    }

    const reviewerId = this.getUserId(reviewer);

    a.status = "published";
    a.reviewedById = reviewerId;
    a.reviewedAt = new Date();
    a.reviewComment = null;
    a.publishedAt = new Date();

    return this.repo.save(a);
  }

  async reject(articleId: string, comment: string, reviewer: any) {
    if (!this.isEditor(reviewer?.role)) {
      throw new ForbiddenException("Rejection requires editor privileges.");
    }

    const a = await this.findOne(articleId);
    if (a.status !== "in_review") {
      throw new BadRequestException("This article is not in review.");
    }

    const reviewerId = this.getUserId(reviewer);

    a.status = "rejected";
    a.reviewedById = reviewerId;
    a.reviewedAt = new Date();
    a.reviewComment = comment?.trim() ? comment.trim() : "Rejected";

    return this.repo.save(a);
  }

  /* ================================================== */

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim() +
      "-" +
      Date.now()
    );
  }
}
