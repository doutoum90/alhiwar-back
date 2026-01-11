// src/database/seeds/02-categories.seeder.ts
import { AppDataSource } from "../data-source";
import { Category, CategoryStatus } from "../../entities/category.entity";
import { User, UserRole } from "../../entities/user.entity";

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

// Helpers workflow: ensure coherence
const ensureDraft = (c: Partial<Category>) => {
  c.status = CategoryStatus.DRAFT;
  c.submittedAt = null;
  c.submittedById = null;
  c.reviewedAt = null;
  c.reviewedById = null;
  c.reviewComment = null;
};

const ensureInReview = (c: Partial<Category>) => {
  c.status = CategoryStatus.IN_REVIEW;
  c.submittedAt = c.submittedAt ?? hoursAgo(6);
  c.submittedById = c.submittedById ?? c.createdById ?? null;
  c.reviewedAt = null;
  c.reviewedById = null;
  c.reviewComment = null;
};

const ensureRejected = (c: Partial<Category>) => {
  c.status = CategoryStatus.REJECTED;
  c.submittedAt = c.submittedAt ?? hoursAgo(48);
  c.submittedById = c.submittedById ?? c.createdById ?? null;
  c.reviewedAt = c.reviewedAt ?? hoursAgo(36);
  c.reviewedById = c.reviewedById ?? null;
  c.reviewComment = c.reviewComment ?? "Rejected for demo purposes.";
};

const ensurePublished = (c: Partial<Category>) => {
  c.status = CategoryStatus.PUBLISHED;
  c.submittedAt = c.submittedAt ?? hoursAgo(24);
  c.submittedById = c.submittedById ?? c.createdById ?? null;
  c.reviewedAt = c.reviewedAt ?? hoursAgo(22);
  c.reviewedById = c.reviewedById ?? null;
  c.reviewComment = c.reviewComment ?? "Approved";
};

const ensureArchived = (c: Partial<Category>) => {
  c.status = CategoryStatus.ARCHIVED;
  // archived generally means it was reviewed at some point
  c.submittedAt = c.submittedAt ?? hoursAgo(96);
  c.submittedById = c.submittedById ?? c.createdById ?? null;
  c.reviewedAt = c.reviewedAt ?? hoursAgo(94);
  c.reviewedById = c.reviewedById ?? null;
  c.reviewComment = c.reviewComment ?? "Archived for demo purposes.";
};

export class CategorySeeder {
  public static async run(): Promise<void> {
    console.log("📂 Seeding categories (workflow coverage)...");

    const categoryRepository = AppDataSource.getRepository(Category);
    const userRepo = AppDataSource.getRepository(User);

    const admin = await userRepo.findOne({ where: { role: UserRole.ADMIN } as any });
    const editor = await userRepo.findOne({ where: { role: UserRole.EDITOR_IN_CHIEF } as any });
    const author = await userRepo.findOne({ where: { role: UserRole.AUTHOR } as any });
    const journalist = await userRepo.findOne({ where: { role: UserRole.JOURNALIST } as any });

    // creator: prefer author/journalist, else admin/editor
    const creatorUserId =
      author?.id ?? journalist?.id ?? editor?.id ?? admin?.id ?? null;

    // reviewer: prefer editor/admin
    const reviewerUserId =
      editor?.id ?? admin?.id ?? null;

    const categories: Array<Partial<Category>> = [
      // ===================== Published =====================
      {
        name: "Actualites",
        slug: "actualites",
        description: "Dernieres actualites nationales et internationales",
        color: "#DC2626",
        sortOrder: 1,
        createdById: admin?.id ?? creatorUserId,
        submittedById: admin?.id ?? creatorUserId,
        submittedAt: hoursAgo(30),
        reviewedById: reviewerUserId,
        reviewedAt: hoursAgo(28),
        reviewComment: "Approved",
        status: CategoryStatus.PUBLISHED,
      },
      {
        name: "Politique",
        slug: "politique",
        description: "Analyses et debats politiques",
        color: "#7C3AED",
        sortOrder: 2,
        createdById: admin?.id ?? creatorUserId,
        submittedById: admin?.id ?? creatorUserId,
        submittedAt: hoursAgo(26),
        reviewedById: reviewerUserId,
        reviewedAt: hoursAgo(24),
        reviewComment: "Approved",
        status: CategoryStatus.PUBLISHED,
      },
      {
        name: "Economie",
        slug: "economie",
        description: "Actualites economiques et financieres",
        color: "#059669",
        sortOrder: 3,
        createdById: admin?.id ?? creatorUserId,
        submittedById: admin?.id ?? creatorUserId,
        submittedAt: hoursAgo(22),
        reviewedById: reviewerUserId,
        reviewedAt: hoursAgo(20),
        reviewComment: "Approved",
        status: CategoryStatus.PUBLISHED,
      },

      // ===================== In review =====================
      {
        name: "Technologie",
        slug: "technologie",
        description: "Innovations et actualites technologiques",
        color: "#2563EB",
        sortOrder: 4,
        createdById: creatorUserId,
        submittedById: creatorUserId,
        submittedAt: hoursAgo(8),
        reviewedById: null,
        reviewedAt: null,
        reviewComment: null,
        status: CategoryStatus.IN_REVIEW,
      },

      // ===================== Rejected =====================
      {
        name: "Culture",
        slug: "culture",
        description: "Arts, litterature et evenements culturels",
        color: "#DB2777",
        sortOrder: 5,
        createdById: creatorUserId,
        submittedById: creatorUserId,
        submittedAt: hoursAgo(48),
        reviewedById: reviewerUserId,
        reviewedAt: hoursAgo(36),
        reviewComment: "Rejected: improve description and ensure slug uniqueness rules.",
        status: CategoryStatus.REJECTED,
      },

      // ===================== Archived =====================
      {
        name: "Sport",
        slug: "sport",
        description: "Actualites sportives et evenements",
        color: "#EA580C",
        sortOrder: 6,
        createdById: admin?.id ?? creatorUserId,
        submittedById: admin?.id ?? creatorUserId,
        submittedAt: hoursAgo(90),
        reviewedById: reviewerUserId,
        reviewedAt: hoursAgo(88),
        reviewComment: "Archived for demo purposes.",
        status: CategoryStatus.ARCHIVED,
      },

      // ===================== Draft =====================
      {
        name: "Societe",
        slug: "societe",
        description: "Sujets de societe",
        color: "#0ea5e9",
        sortOrder: 7,
        createdById: creatorUserId,
        submittedById: null,
        submittedAt: null,
        reviewedById: null,
        reviewedAt: null,
        reviewComment: null,
        status: CategoryStatus.DRAFT,
      },

      // ===================== Edge cases =====================
      // Draft with minimal fields (no description/color)
      {
        name: "Opinions",
        slug: "opinions",
        description: null,
        color: null,
        sortOrder: 8,
        createdById: creatorUserId,
        status: CategoryStatus.DRAFT,
      },

      // In review with no reviewer assigned yet (explicit)
      {
        name: "International",
        slug: "international",
        description: "Actualites internationales",
        color: "#22c55e",
        sortOrder: 9,
        createdById: creatorUserId,
        status: CategoryStatus.IN_REVIEW,
      },
    ];

    // Enforce coherence for every category
    for (const c of categories) {
      c.name = String(c.name ?? "").trim();
      c.slug = String(c.slug ?? "").trim();
      c.description = c.description === undefined ? null : (c.description ?? null);
      c.image = c.image === undefined ? null : (c.image ?? null);
      c.color = c.color === undefined ? null : (c.color ?? null);
      c.sortOrder = Number(c.sortOrder ?? 0);

      // default creator
      c.createdById = (c.createdById ?? creatorUserId) ?? null;

      // workflow coherence
      switch (c.status) {
        case CategoryStatus.DRAFT:
          ensureDraft(c);
          break;
        case CategoryStatus.IN_REVIEW:
          ensureInReview(c);
          break;
        case CategoryStatus.REJECTED:
          c.reviewedById = c.reviewedById ?? reviewerUserId ?? null;
          ensureRejected(c);
          break;
        case CategoryStatus.PUBLISHED:
          c.reviewedById = c.reviewedById ?? reviewerUserId ?? null;
          ensurePublished(c);
          break;
        case CategoryStatus.ARCHIVED:
          c.reviewedById = c.reviewedById ?? reviewerUserId ?? null;
          ensureArchived(c);
          break;
        default:
          ensureDraft(c);
          break;
      }
    }

    let created = 0;
    let updated = 0;
    let unchanged = 0;

    for (const c of categories) {
      const slug = String(c.slug || "").trim();
      if (!slug) continue;

      const existing = await categoryRepository.findOne({ where: { slug } as any });

      if (!existing) {
        const entity = new Category();
        entity.name = String(c.name || "").trim();
        entity.slug = slug;
        entity.description = c.description ?? null;
        entity.image = c.image ?? null;
        entity.color = c.color ?? null;
        entity.sortOrder = Number(c.sortOrder ?? 0);
        entity.status = (c.status ?? CategoryStatus.DRAFT) as any;

        entity.createdById = c.createdById ?? null;
        entity.submittedById = c.submittedById ?? null;
        entity.submittedAt = c.submittedAt ?? null;
        entity.reviewedById = c.reviewedById ?? null;
        entity.reviewedAt = c.reviewedAt ?? null;
        entity.reviewComment = c.reviewComment ?? null;

        await categoryRepository.save(entity);
        created++;
        console.log(`  ✅ Created: ${entity.name} (${entity.status})`);
      } else {
        let changed = false;

        const set = <K extends keyof Category>(key: K, val: Category[K]) => {
          if ((existing[key] as any) !== (val as any)) {
            (existing[key] as any) = val as any;
            changed = true;
          }
        };

        set("name", String(c.name || existing.name).trim() as any);
        set("description", (c.description ?? null) as any);
        set("image", (c.image ?? null) as any);
        set("color", (c.color ?? null) as any);
        set("sortOrder", Number(c.sortOrder ?? existing.sortOrder) as any);
        set("status", (c.status ?? existing.status) as any);

        set("createdById", (c.createdById ?? null) as any);
        set("submittedById", (c.submittedById ?? null) as any);
        set("submittedAt", (c.submittedAt ?? null) as any);
        set("reviewedById", (c.reviewedById ?? null) as any);
        set("reviewedAt", (c.reviewedAt ?? null) as any);
        set("reviewComment", (c.reviewComment ?? null) as any);

        if (changed) {
          await categoryRepository.save(existing);
          updated++;
          console.log(`  🔁 Updated: ${existing.name} (${existing.status})`);
        } else {
          unchanged++;
        }
      }
    }

    console.log(
      `📊 Categories: ${created} created, ${updated} updated, ${unchanged} unchanged\n`
    );
  }
}
