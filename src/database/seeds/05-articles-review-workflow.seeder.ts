import { AppDataSource } from "../data-source";
import { Article } from "../../entities/article.entity";
import { User, UserRole } from "../../entities/user.entity";

let faker: any = null;
try {
  faker = require("@faker-js/faker").faker;
} catch { }
const slugify = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export class ArticlesSeeder {
  public static async run(): Promise<void> {
    console.log("🔄 Seeding articles (7 per category, workflow-friendly)...");

    const articleRepo = AppDataSource.getRepository(Article);
    const userRepo = AppDataSource.getRepository(User);

    const writers = await userRepo.find({
      where: [
        { role: UserRole.JOURNALIST } as any,
        { role: UserRole.AUTHOR } as any,
        { role: UserRole.EDITOR_IN_CHIEF } as any,
        { role: UserRole.ADMIN } as any,
      ],
    });

    if (!writers.length) {
      console.log("❌ No writers found. Run UsersSeeder first.");
      return;
    }

    const categories: Array<{ id: string; name: string; slug: string }> = await AppDataSource.query(
      `SELECT id, name, slug FROM categories ORDER BY name ASC`
    );

    if (!categories.length) {
      console.log("❌ No categories found. Run CategorySeeder first.");
      return;
    }

    const meta = articleRepo.metadata;
    const has = (col: string) => Boolean(meta.columns.find((c) => c.propertyName === col));
    const hasExcerpt = has("excerpt");
    const hasViews = has("views");
    const hasTags = has("tags");
    const hasPublishedAt = has("publishedAt");

    const PER_CATEGORY = 7;

    let created = 0;
    let skipped = 0;

    for (const cat of categories) {
      const catName = cat.name?.trim() || "General";
      const baseSlug = cat.slug?.trim() || slugify(catName);
      const catShort = String(cat.id).slice(0, 6);

      for (let i = 1; i <= PER_CATEGORY; i++) {
        const writer = pick(writers);

        const title = faker.lorem.sentence({ min: 4, max: 8 }).replace(/\.$/, "");
        const slug = `${baseSlug}-${catShort}-${i}`;

        const exists = await articleRepo.findOne({ where: { slug } as any });
        if (exists) {
          skipped++;
          continue;
        }

        const r = Math.random();
        const status = r < 0.65 ? "draft" : r < 0.9 ? "published" : "archived";

        const contentHtml = `
          <h2>${title}</h2>
          <p>${faker.lorem.paragraphs({ min: 2, max: 4 }, "<br/>")}</p>
          <p><strong>Category:</strong> ${catName}</p>
        `.trim();

        const a = new Article();
        a.title = title;
        a.slug = slug;
        a.content = contentHtml;
        a.status = status as any;
        (a as any).authorId = writer.id;
        (a as any).categoryId = cat.id;

        if (hasExcerpt) (a as any).excerpt = faker.lorem.sentence({ min: 10, max: 16 });
        if (hasViews) (a as any).views = faker.number.int({ min: 0, max: 2500 });
        if (hasTags) (a as any).tags = faker.helpers.arrayElements(
          ["politics", "economy", "tech", "culture", "sports", "local", "world", "analysis"],
          faker.number.int({ min: 0, max: 4 })
        );

        if (hasPublishedAt) {
          (a as any).publishedAt =
            status === "published" ? faker.date.recent({ days: 30 }) : null;
        }

        await articleRepo.save(a);
        created++;
      }
    }

    console.log(`✅ Articles: ${created} created, ${skipped} existing\n`);
  }
}
