import { AppDataSource } from "../data-source";
import { Article } from "../../entities/article.entity";
import { User } from "../../entities/user.entity";
import { ArticleLike } from "../../entities/article-like.entity";

let faker: any = null;
try {
  faker = require("@faker-js/faker").faker;
} catch {}

const rand = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export class ArticleLikeSeeder {
  public static async run(): Promise<void> {
    console.log("❤️ Seeding article_likes...");

    const articleRepo = AppDataSource.getRepository(Article);
    const userRepo = AppDataSource.getRepository(User);
    const likeRepo = AppDataSource.getRepository(ArticleLike);

    const articles = await articleRepo.find();
    const users = await userRepo.find();

    if (!articles.length || !users.length) {
      console.log("  ⚠️ Articles ou users manquants");
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const article of articles) {
      const maxLikes = Math.min(
        users.length,
        faker ? faker.number.int({ min: 1, max: 3 }) : rand(1, 3)
      );

      const shuffledUsers = users
        .slice()
        .sort(() => 0.5 - Math.random())
        .slice(0, maxLikes);

      for (const user of shuffledUsers) {
        const exists = await likeRepo.findOne({
          where: { articleId: article.id, userId: user.id } as any,
        });

        if (exists) {
          skipped++;
          continue;
        }

        const like = likeRepo.create({
          articleId: article.id,
          userId: user.id,
        });

        await likeRepo.save(like);
        created++;
      }
    }

    console.log(`📊 Likes: ${created} created, ${skipped} skipped\n`);
  }
}
