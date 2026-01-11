import { AppDataSource } from "../data-source";
import { Article } from "../../entities/article.entity";
import { User, UserRole } from "../../entities/user.entity";
import { ArticleAuthor } from "../../entities/article-author.entity";

let faker: any = null;
try {
  faker = require("@faker-js/faker").faker;
} catch {}

const pickManyUnique = <T,>(arr: T[], n: number): T[] => {
  const copy = arr.slice();
  const out: T[] = [];
  while (copy.length && out.length < n) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

export class ArticleAuthorSeeder {
  public static async run(): Promise<void> {
    console.log("👥 Seeding article_authors (pivot)...");

    const articleRepo = AppDataSource.getRepository(Article);
    const userRepo = AppDataSource.getRepository(User);
    const pivotRepo = AppDataSource.getRepository(ArticleAuthor);

    const articles = await articleRepo.find();
    if (!articles.length) {
      console.log("  ⚠️ Aucun article trouvé");
      return;
    }

    const users = await userRepo.find();
    const pool = users.filter((u) =>
      [UserRole.ADMIN, UserRole.EDITOR_IN_CHIEF, UserRole.AUTHOR, UserRole.JOURNALIST].includes(u.role)
    );

    if (!pool.length) {
      console.log("  ⚠️ Aucun user (admin/editor/author/journalist) trouvé");
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const article of articles) {
      const existing = await pivotRepo.count({ where: { articleId: article.id } as any });
      if (existing > 0) {
        skipped++;
        continue;
      }

      const howMany = faker ? faker.number.int({ min: 1, max: Math.min(3, pool.length) }) : Math.min(2, pool.length);
      const chosen = pickManyUnique(pool, howMany);

      const main = chosen[0];
      const others = chosen.slice(1);

      const rows: ArticleAuthor[] = [
        pivotRepo.create({ articleId: article.id, userId: main.id, isMain: true }),
        ...others.map((u) => pivotRepo.create({ articleId: article.id, userId: u.id, isMain: false })),
      ];

      await pivotRepo.save(rows);
      created += rows.length;
    }

    console.log(`📊 ArticleAuthors: ${created} created, ${skipped} skipped\n`);
  }
}
