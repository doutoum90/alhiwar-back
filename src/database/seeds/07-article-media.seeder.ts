import { AppDataSource } from "../data-source";
import { Article } from "../../entities/article.entity";
import { ArticleMedia, MediaType } from "../../entities/article-media.entity";
import { faker } from "@faker-js/faker";

const demoImage = (seed: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(seed)}/1200/700`;

const demoPdf = (seed: string) =>
  `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf#${encodeURIComponent(seed)}`;

const demoVideo = (seed: string) =>
  `https://www.youtube.com/embed/dQw4w9WgXcQ?si=${encodeURIComponent(seed)}`;

export class ArticleMediaSeeder {
  public static async run(): Promise<void> {
    console.log("🖼️ Seeding article media (article_media) ...");

    const articleRepo = AppDataSource.getRepository(Article);
    const mediaRepo = AppDataSource.getRepository(ArticleMedia);

    const articles = await articleRepo.find();
    if (!articles.length) {
      console.log("  ⚠️ No articles found");
      return;
    }

    let created = 0;
    let skipped = 0;

    for (const article of articles) {
      const existing = await mediaRepo.count({ where: { articleId: article.id } as any });
      if (existing > 0) {
        skipped++;
        continue;
      }

      const r = Math.random();
      const howMany = r < 0.3 ? 0 : r < 0.8 ? 1 : faker.number.int({ min: 2, max: 3 });
      if (howMany === 0) continue;

      const seed = `${article.id}-${faker.string.alphanumeric(6)}`;

      const rows = Array.from({ length: howMany }).map((_, i) => {
        const type =
          faker.number.int({ min: 1, max: 100 }) <= 70
            ? MediaType.IMAGE
            : faker.number.int({ min: 1, max: 100 }) <= 85
              ? MediaType.PDF
              : MediaType.VIDEO;

        const url =
          type === MediaType.IMAGE
            ? demoImage(`${seed}-${i}`)
            : type === MediaType.PDF
              ? demoPdf(`${seed}-${i}`)
              : demoVideo(`${seed}-${i}`);

        return {
          articleId: article.id,
          type,
          url,
          title:
            type === MediaType.IMAGE
              ? `Image ${i + 1}`
              : type === MediaType.PDF
                ? `Document ${i + 1}`
                : `Video ${i + 1}`,
          position: i,
        } as Partial<ArticleMedia>;
      });

      await mediaRepo.insert(rows as any);
      created += rows.length;
    }

    console.log(`📊 Media: ${created} created, ${skipped} skipped (already had media)\n`);
  }
}
