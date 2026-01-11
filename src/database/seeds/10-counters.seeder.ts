import { AppDataSource } from "../data-source";

export class CountersSeeder {
    public static async run(): Promise<void> {
        console.log("🧮 Recomputing counters...");

        // likesCount (si la colonne existe)
        try {
            await AppDataSource.query(`
        UPDATE articles a
        SET "likesCount" = COALESCE(x.cnt, 0)
        FROM (
          SELECT "articleId", COUNT(*)::int AS cnt
          FROM article_likes
          GROUP BY "articleId"
        ) x
        WHERE a.id = x."articleId"
      `);
        } catch { }

        // commentsCount (si colonne existe)
        try {
            await AppDataSource.query(`
        UPDATE articles a
        SET "commentsCount" = COALESCE(x.cnt, 0)
        FROM (
          SELECT "articleId", COUNT(*)::int AS cnt
          FROM article_comments
          GROUP BY "articleId"
        ) x
        WHERE a.id = x."articleId"
      `);
        } catch { }

        // users: articlesCount + totalViews (views doit exister)
        try {
            await AppDataSource.query(`
        UPDATE users u
        SET "articlesCount" = COALESCE(x.cnt, 0),
            "totalViews" = COALESCE(x.sum_views, 0)
        FROM (
          SELECT "authorId", COUNT(*)::int AS cnt, COALESCE(SUM(views),0)::int AS sum_views
          FROM articles
          GROUP BY "authorId"
        ) x
        WHERE u.id = x."authorId"
      `);
        } catch { }

        console.log("✅ Counters recomputed\n");
    }
}
