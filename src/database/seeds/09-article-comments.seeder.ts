// src/database/seeds/09-article-comments.seeder.ts
import { AppDataSource } from "../data-source";
import { Article } from "../../entities/article.entity";
import { User } from "../../entities/user.entity";
import { ArticleComment } from "../../entities/article-comment.entity";

// faker optionnel (ne casse pas le build si absent)
let faker: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  faker = require("@faker-js/faker").faker;
} catch {}

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const pickMany = <T,>(arr: T[], count: number) =>
  arr
    .slice()
    .sort(() => 0.5 - Math.random())
    .slice(0, Math.min(arr.length, count));

const makeCommentText = (title: string) => {
  if (faker) {
    const sentence = faker.lorem.sentences({ min: 1, max: 2 });
    return `${sentence} (Sur: "${title}")`;
  }
  // fallback
  return `Commentaire sur "${title}"`;
};

export class ArticleCommentSeeder {
  public static async run(): Promise<void> {
    console.log("💬 Seeding article_comments...");

    const articleRepo = AppDataSource.getRepository(Article);
    const userRepo = AppDataSource.getRepository(User);
    const commentRepo = AppDataSource.getRepository(ArticleComment);

    const articles = await articleRepo.find();
    const users = await userRepo.find();

    if (!articles.length || !users.length) {
      console.log("  ⚠️ Articles ou users manquants");
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const article of articles) {
      const existingCount = await commentRepo.count({
        where: { articleId: article.id } as any,
      });
      if (existingCount > 0) {
        skipped++;
        continue;
      }

      // 1 à 3 commentaires par article (selon nb users)
      const howMany = Math.min(
        users.length,
        faker ? faker.number.int({ min: 1, max: 3 }) : rand(1, 3)
      );

      const chosen = pickMany(users, howMany);

      // ✅ IMPORTANT: build a flat ArticleComment[] (pas [][] )
      const rows: ArticleComment[] = chosen.map((u, idx) =>
        commentRepo.create({
          articleId: article.id,
          userId: u.id,
          content: `${makeCommentText(article.title)} #${idx + 1}`,
          isHidden: false,
        })
      );

      // ✅ save une liste simple ArticleComment[]
      await commentRepo.save(rows);

      created += rows.length;
    }

    console.log(`📊 Comments: ${created} created, ${skipped} skipped (already had comments)\n`);
  }
}
