import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Ad, AdType, AdWorkflowStatus } from "../entities/ad.entity";
import { CreateAdDto } from "./dto/create-ad.dto";
import { UpdateAdDto } from "./dto/update-ad.dto";

@Injectable()
export class AdsService {
  constructor(@InjectRepository(Ad) private adRepository: Repository<Ad>) {}

  /* ======================= CRUD ======================= */

  async create(dto: CreateAdDto, meId: string): Promise<Ad> {
    const ad = this.adRepository.create({
      title: dto.title,
      content: dto.content,
      image: dto.image ?? null,
      link: dto.link ?? null,
      type: dto.type ?? AdType.BANNER,
      startDate: dto.startDate ? new Date(dto.startDate) : null,
      endDate: dto.endDate ? new Date(dto.endDate) : null,

      status: AdWorkflowStatus.DRAFT,

      createdById: meId ?? null,
      submittedAt: null,
      submittedById: null,
      reviewedAt: null,
      reviewedById: null,
      reviewComment: null,
    });

    return this.adRepository.save(ad);
  }

  async findAll(): Promise<Ad[]> {
    return this.adRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findOne(id: string): Promise<Ad> {
    const ad = await this.adRepository.findOne({ where: { id } });
    if (!ad) throw new NotFoundException("Ad not found");
    return ad;
  }

  async update(id: string, dto: UpdateAdDto): Promise<Ad> {
    const ad = await this.findOne(id);

    if (dto.title !== undefined) ad.title = dto.title;
    if (dto.content !== undefined) ad.content = dto.content;

    if (dto.image !== undefined) ad.image = dto.image ?? null;
    if (dto.link !== undefined) ad.link = dto.link ?? null;

    if (dto.type !== undefined) ad.type = dto.type;

    if (dto.startDate !== undefined) ad.startDate = dto.startDate ? new Date(dto.startDate) : null;
    if (dto.endDate !== undefined) ad.endDate = dto.endDate ? new Date(dto.endDate) : null;

    return this.adRepository.save(ad);
  }

  async remove(id: string): Promise<void> {
    const ad = await this.findOne(id);
    await this.adRepository.remove(ad);
  }

  /* ======================= PUBLIC (PUBLISHED) ======================= */

  async findPublishedActive(): Promise<Ad[]> {
    const now = new Date();

    return this.adRepository
      .createQueryBuilder("ad")
      .where("ad.status = :status", { status: AdWorkflowStatus.PUBLISHED })
      .andWhere("(ad.startDate IS NULL OR ad.startDate <= :now)", { now })
      .andWhere("(ad.endDate IS NULL OR ad.endDate >= :now)", { now })
      .orderBy("ad.createdAt", "DESC")
      .getMany();
  }

  async findPublishedByType(type: AdType): Promise<Ad[]> {
    const now = new Date();

    return this.adRepository
      .createQueryBuilder("ad")
      .where("ad.type = :type", { type })
      .andWhere("ad.status = :status", { status: AdWorkflowStatus.PUBLISHED })
      .andWhere("(ad.startDate IS NULL OR ad.startDate <= :now)", { now })
      .andWhere("(ad.endDate IS NULL OR ad.endDate >= :now)", { now })
      .orderBy("ad.createdAt", "DESC")
      .getMany();
  }

  /* ======================= WORKFLOW ======================= */

  async getReviewQueue(): Promise<Ad[]> {
    return this.adRepository.find({
      where: { status: AdWorkflowStatus.IN_REVIEW },
      order: { submittedAt: "DESC", createdAt: "DESC" },
    });
  }

  async submit(id: string, meId: string): Promise<Ad> {
    const ad = await this.findOne(id);

    if (![AdWorkflowStatus.DRAFT, AdWorkflowStatus.REJECTED].includes(ad.status)) {
      throw new BadRequestException("Ad cannot be submitted from current status");
    }

    ad.status = AdWorkflowStatus.IN_REVIEW;
    ad.submittedAt = new Date();
    ad.submittedById = meId ?? null;

    ad.reviewedAt = null;
    ad.reviewedById = null;
    ad.reviewComment = null;

    return this.adRepository.save(ad);
  }

  async approve(id: string, reviewerId: string): Promise<Ad> {
    const ad = await this.findOne(id);

    if (ad.status !== AdWorkflowStatus.IN_REVIEW) {
      throw new BadRequestException("Ad is not in review");
    }

    ad.status = AdWorkflowStatus.PUBLISHED;
    ad.reviewedAt = new Date();
    ad.reviewedById = reviewerId ?? null;
    ad.reviewComment = null;

    return this.adRepository.save(ad);
  }

  async reject(id: string, reviewerId: string, comment?: string): Promise<Ad> {
    const ad = await this.findOne(id);

    if (ad.status !== AdWorkflowStatus.IN_REVIEW) {
      throw new BadRequestException("Ad is not in review");
    }

    ad.status = AdWorkflowStatus.REJECTED;
    ad.reviewedAt = new Date();
    ad.reviewedById = reviewerId ?? null;
    ad.reviewComment = comment?.trim() ? comment.trim() : null;

    return this.adRepository.save(ad);
  }

  async archive(id: string, reviewerId: string): Promise<Ad> {
    const ad = await this.findOne(id);

    if (ad.status !== AdWorkflowStatus.PUBLISHED) {
      throw new BadRequestException("Only published ads can be archived");
    }

    ad.status = AdWorkflowStatus.ARCHIVED;
    ad.reviewedAt = new Date();
    ad.reviewedById = reviewerId ?? null;

    return this.adRepository.save(ad);
  }

  /* ======================= TRACKING ======================= */

  async recordClick(id: string): Promise<{ success: boolean; clicks: number }> {
    const ad = await this.findOne(id);
    await this.adRepository.increment({ id }, "clicks", 1);
    return { success: true, clicks: (ad.clicks ?? 0) + 1 };
  }

  async recordImpression(id: string): Promise<{ success: boolean; impressions: number }> {
    const ad = await this.findOne(id);
    await this.adRepository.increment({ id }, "impressions", 1);
    return { success: true, impressions: (ad.impressions ?? 0) + 1 };
  }

  /* ======================= STATS ======================= */

  async getStatistics() {
    const totalAds = await this.adRepository.count();

    const published = await this.adRepository.count({
      where: { status: AdWorkflowStatus.PUBLISHED },
    });

    const inReview = await this.adRepository.count({
      where: { status: AdWorkflowStatus.IN_REVIEW },
    });

    const draft = await this.adRepository.count({
      where: { status: AdWorkflowStatus.DRAFT },
    });

    const rejected = await this.adRepository.count({
      where: { status: AdWorkflowStatus.REJECTED },
    });

    const archived = await this.adRepository.count({
      where: { status: AdWorkflowStatus.ARCHIVED },
    });

    return {
      total: totalAds,
      draft,
      inReview,
      published,
      rejected,
      archived,
    };
  }

  async getAdsByType() {
    return this.adRepository
      .createQueryBuilder("ad")
      .select("ad.type", "type")
      .addSelect("COUNT(*)::int", "count")
      .addSelect("COALESCE(SUM(ad.views), 0)::int", "views")
      .addSelect("COALESCE(SUM(ad.clicks), 0)::int", "clicks")
      .addSelect("COALESCE(SUM(ad.impressions), 0)::int", "impressions")
      .groupBy("ad.type")
      .orderBy("count", "DESC")
      .getRawMany();
  }

  async getTopPerformingAds(limit: number = 10) {
    return this.adRepository.find({
      order: {
        views: "DESC",
        clicks: "DESC",
      },
      take: limit,
      where: { status: AdWorkflowStatus.PUBLISHED },
    });
  }
}
