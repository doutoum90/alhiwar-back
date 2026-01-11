// src/database/seeds/03-articles.seeder.ts
import { AppDataSource } from "../data-source";
import { Article, type ArticleStatus } from "../../entities/article.entity";
import { User, UserRole } from "../../entities/user.entity";

let faker: any = null;
try {
  faker = require("@faker-js/faker").faker;
} catch {}

type CatRow = { id: string; name?: string; slug?: string };

const slugify = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

export class ArticlesSeeder {
  public static async run(): Promise<void> {
    console.log("🔄 Seeding articles (workflow + coherence)...");

    const articleRepo = AppDataSource.getRepository(Article);
    const userRepo = AppDataSource.getRepository(User);

    // pools
    const admins = await userRepo.find({ where: { role: UserRole.ADMIN } as any });
    const editors = await userRepo.find({ where: { role: UserRole.EDITOR_IN_CHIEF } as any });
    const journalists = await userRepo.find({ where: { role: UserRole.JOURNALIST } as any });
    const authors = await userRepo.find({ where: { role: UserRole.AUTHOR } as any });

    const writePool = [...journalists, ...authors];
    const reviewPool = [...admins, ...editors];
    const publishPool = [...admins, ...editors];

    if (!writePool.length) {
      console.log("❌ No writers (author/journalist). Run UsersSeeder first.");
      return;
    }
    if (!reviewPool.length) {
      console.log("❌ No reviewers (admin/editor). Run UsersSeeder first.");
      return;
    }

    let categories: CatRow[] = [];
    try {
      categories = await AppDataSource.query(`SELECT id, name, slug FROM categories ORDER BY "sortOrder" ASC, name ASC`);
    } catch (e: any) {
      console.log("❌ Cannot read categories table.", e?.message ?? e);
      return;
    }
    if (!categories.length) {
      console.log("❌ No categories found. Run CategorySeeder first.");
      return;
    }

    const PER_CATEGORY = 10;

    // distribution stable & covers all cases
    const plan: ArticleStatus[] = [
      "published",
      "published",
      "published",
      "in_review",
      "in_review",
      "draft",
      "draft",
      "rejected",
      "archived",
      "archived",
    ];

    let created = 0;
    let skipped = 0;

    for (const cat of categories) {
      const catName = (cat.name || "General").trim() || "General";
      const baseSlug = (cat.slug || slugify(catName)) || "general";
      const catShort = String(cat.id).slice(0, 6);

      console.log(`\n📌 Category: ${catName}`);

      for (let i = 1; i <= PER_CATEGORY; i++) {
        const status: ArticleStatus = plan[i - 1] ?? "draft";

        const writer = pick(writePool);
        const reviewer = pick(reviewPool);
        const publisher = pick(publishPool);

        const title = faker
          ? `${catName} — ${faker.lorem.sentence({ min: 3, max: 7 }).replace(/\.$/, "")}`
          : `${catName} — Article ${i}`;

        const slug = `${baseSlug}-${catShort}-${i}`;

        const exists = await articleRepo.findOne({ where: { slug } as any });
        if (exists) {
          skipped++;
          continue;
        }

        const contentBody = faker
          ? faker.lorem.paragraphs({ min: 2, max: 4 }).replace(/\n/g, "</p><p>")
          : "Demo content.";

        const a = new Article();
        a.title = title;
        a.slug = slug;
        a.excerpt = faker ? faker.lorem.sentences({ min: 1, max: 2 }) : "Demo excerpt";
        a.content = `<h2>${title}</h2><p>${contentBody}</p><p><strong>Category:</strong> ${catName}</p>`;
        a.status = status;

        // base relations
        a.categoryId = cat.id;

        // AUTHOR RULE:
        // - published/archived => admin/editor as author
        // - others => writer
        a.authorId = status === "published" || status === "archived" ? publisher.id : writer.id;

        // tags + counters
        a.tags = faker
          ? faker.helpers.arrayElements(
              ["politics", "economy", "tech", "culture", "sports", "local", "world", "analysis"],
              faker.number.int({ min: 0, max: 4 })
            )
          : ["demo"];
        a.views = faker ? faker.number.int({ min: 0, max: 6000 }) : Math.floor(Math.random() * 6000);
        a.likesCount = 0;
        a.commentsCount = 0;

        // workflow
        a.submittedAt = null;
        a.submittedById = null;
        a.reviewedAt = null;
        a.reviewedById = null;
        a.reviewComment = null;
        a.publishedAt = null;

        if (status === "in_review") {
          a.submittedAt = daysAgo(2);
          a.submittedById = writer.id;
        }

        if (status === "rejected") {
          a.submittedAt = daysAgo(5);
          a.submittedById = writer.id;
          a.reviewedAt = daysAgo(4);
          a.reviewedById = reviewer.id;
          a.reviewComment = "Rejected: please improve excerpt and add more sources.";
        }

        if (status === "published") {
          a.submittedAt = daysAgo(7);
          a.submittedById = writer.id;
          a.reviewedAt = daysAgo(6);
          a.reviewedById = reviewer.id;
          a.reviewComment = "Approved";
          a.publishedAt = daysAgo(faker ? faker.number.int({ min: 1, max: 30 }) : 10);
        }

        if (status === "archived") {
          a.submittedAt = daysAgo(90);
          a.submittedById = writer.id;
          a.reviewedAt = daysAgo(88);
          a.reviewedById = reviewer.id;
          a.reviewComment = "Archived for demo / old content.";
          a.publishedAt = daysAgo(80);
        }

        await articleRepo.save(a);
        created++;
      }
    }

    console.log(`\n📊 Articles: ${created} created, ${skipped} skipped\n`);
  }
}
