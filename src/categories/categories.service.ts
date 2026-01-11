import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Category, CategoryStatus } from "../entities/category.entity";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";
import { slugify } from "../utils/slugify";
import { Article } from "../entities/article.entity";
import { UserRole } from "../entities/user.entity";
import { AuthUser } from "src/auth/auth.controller";

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>
  ) {}

  async getStatistics() {
    const total = await this.categoryRepo.count();

    const topCategories = await this.categoryRepo
      .createQueryBuilder("c")
      .leftJoin(Article, "a", '"a"."categoryId" = "c"."id"')
      .select('"c"."id"', "id")
      .addSelect('"c"."name"', "name")
      .addSelect('"c"."slug"', "slug")
      .addSelect('COUNT("a"."id")::int', "articlesCount")
      .groupBy('"c"."id"')
      .addGroupBy('"c"."name"')
      .addGroupBy('"c"."slug"')
      .orderBy('COUNT("a"."id")', "DESC")
      .limit(10)
      .getRawMany<{ id: string; name: string; slug: string; articlesCount: number }>();

    return { total, topCategories };
  }

  private isPrivileged(me: any): boolean {
    const role = String(me?.role ?? "").toLowerCase();
    return role === UserRole.ADMIN || role === UserRole.EDITOR_IN_CHIEF;
  }

  async create(dto: CreateCategoryDto, me: AuthUser) {
    const name = dto.name.trim();
    const slug = slugify(dto.slug || name);

    if (!slug) throw new BadRequestException("Invalid slug");

    const existing = await this.categoryRepo.findOne({ where: { slug } });
    if (existing) throw new BadRequestException("Slug already used");

    const privileged = this.isPrivileged(me);

    const category = this.categoryRepo.create({
      name,
      slug,
      description: dto.description?.trim() || null,
      image: dto.image?.trim() || null,
      color: dto.color?.trim() || null,
      sortOrder: dto.sortOrder ?? 0,

      createdById: me?.userId ?? null,

      status: privileged ? CategoryStatus.PUBLISHED : CategoryStatus.IN_REVIEW,
      submittedAt: privileged ? null : new Date(),
      submittedById: privileged ? null : (me?.userId ?? null),

      reviewedAt: null,
      reviewedById: null,
      reviewComment: null,
    });

    return this.categoryRepo.save(category);
  }

  async findAll() {
    return this.categoryRepo.find({
      order: { sortOrder: "ASC", createdAt: "DESC" },
    });
  }

  async findPublished() {
    return this.categoryRepo.find({
      where: { status: CategoryStatus.PUBLISHED },
      order: { sortOrder: "ASC", createdAt: "DESC" },
    });
  }

  async findOne(id: string) {
    const cat = await this.categoryRepo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException("Category not found");
    return cat;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const cat = await this.findOne(id);

    if (dto.name !== undefined) cat.name = dto.name.trim();

    if (dto.slug !== undefined) {
      const nextSlug = slugify(dto.slug || cat.name);
      if (!nextSlug) throw new BadRequestException("Invalid slug");

      const conflict = await this.categoryRepo.findOne({ where: { slug: nextSlug } });
      if (conflict && conflict.id !== cat.id) throw new BadRequestException("Slug already used");
      cat.slug = nextSlug;
    }

    if (dto.description !== undefined) cat.description = dto.description?.trim() || null;
    if (dto.image !== undefined) cat.image = dto.image?.trim() || null;
    if (dto.color !== undefined) cat.color = dto.color?.trim() || null;
    if (dto.sortOrder !== undefined) cat.sortOrder = dto.sortOrder ?? 0;

    return this.categoryRepo.save(cat);
  }

  async remove(id: string) {
    const cat = await this.findOne(id);
    await this.categoryRepo.remove(cat);
    return { deleted: true, id };
  }

  /* ======================= WORKFLOW ======================= */

  async getReviewQueue() {
    return this.categoryRepo.find({
      where: { status: CategoryStatus.IN_REVIEW },
      order: { submittedAt: "DESC", createdAt: "DESC" },
    });
  }

  async submit(id: string, meId: string) {
    const cat = await this.findOne(id);

    if (![CategoryStatus.DRAFT, CategoryStatus.REJECTED].includes(cat.status)) {
      throw new BadRequestException("Category cannot be submitted from current status");
    }

    cat.status = CategoryStatus.IN_REVIEW;
    cat.submittedAt = new Date();
    cat.submittedById = meId ?? null;

    cat.reviewedAt = null;
    cat.reviewedById = null;
    cat.reviewComment = null;

    return this.categoryRepo.save(cat);
  }

  async approve(id: string, reviewerId: string) {
    const cat = await this.findOne(id);

    if (cat.status !== CategoryStatus.IN_REVIEW) {
      throw new BadRequestException("Category is not in review");
    }

    cat.status = CategoryStatus.PUBLISHED;
    cat.reviewedAt = new Date();
    cat.reviewedById = reviewerId ?? null;
    cat.reviewComment = null;

    return this.categoryRepo.save(cat);
  }

  async reject(id: string, reviewerId: string, comment?: string) {
    const cat = await this.findOne(id);

    if (cat.status !== CategoryStatus.IN_REVIEW) {
      throw new BadRequestException("Category is not in review");
    }

    cat.status = CategoryStatus.REJECTED;
    cat.reviewedAt = new Date();
    cat.reviewedById = reviewerId ?? null;
    cat.reviewComment = comment?.trim() ? comment.trim() : null;

    return this.categoryRepo.save(cat);
  }

  async archive(id: string, reviewerId: string) {
    const cat = await this.findOne(id);

    if (cat.status !== CategoryStatus.PUBLISHED) {
      throw new BadRequestException("Only published categories can be archived");
    }

    cat.status = CategoryStatus.ARCHIVED;
    cat.reviewedAt = new Date();
    cat.reviewedById = reviewerId ?? null;

    return this.categoryRepo.save(cat);
  }
}
