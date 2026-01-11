// src/database/seeds/run.ts
import "reflect-metadata";
import { config } from "dotenv";
config();

import { AppDataSource } from "../data-source";

import { PermissionsSeeder } from "./00-permissions.seeder";
import { RolesSeeder } from "./00-roles.seeder";
import { RolePermissionsSeeder } from "./00-role-permissions.seeder";
import { UserRoleLinksSeeder } from "./00-user-role-links.seeder";

import { UsersSeeder } from "./01-users.seeder";
import { CategorySeeder } from "./02-categories.seeder";
import { ArticlesSeeder } from "./03-articles.seeder";
import { AdsSeeder } from "./04-ads.seeder";

import { ArticleAuthorSeeder } from "./06-article-authors.seeder";
import { ArticleMediaSeeder } from "./07-article-media.seeder";
import { ArticleLikeSeeder } from "./08-article-likes.seeder";
import { ArticleCommentSeeder } from "./09-article-comments.seeder";

import { CountersSeeder } from "./10-counters.seeder";
import { ApiKeysSeeder } from "./10-api-keys.seeder";
import { NewsletterSeeder } from "./11-newsletter.seeder";
import { ContactsSeeder } from "./12-contacts.seeder";
import { AppSettingsSeeder } from "./13-app-settings.seeder";

import { User } from "../../entities/user.entity";
import { Category } from "../../entities/category.entity";
import { Article } from "../../entities/article.entity";
import { Ad } from "../../entities/ad.entity";
import { ArticleAuthor } from "../../entities/article-author.entity";
import { ArticleMedia } from "../../entities/article-media.entity";
import { ArticleLike } from "../../entities/article-like.entity";
import { ArticleComment } from "../../entities/article-comment.entity";

async function runAllSeeders() {
  console.log("🚀 Seeding start...\n");

  try {
    await AppDataSource.initialize();
    console.log("✅ DB connected\n");

    await PermissionsSeeder.run();
    await RolesSeeder.run();
    await RolePermissionsSeeder.run();

    await UsersSeeder.run();
    await UserRoleLinksSeeder.run();

    await CategorySeeder.run();
    await ArticlesSeeder.run();

    await ArticleAuthorSeeder.run();
    await ArticleMediaSeeder.run();
    await ArticleLikeSeeder.run();
    await ArticleCommentSeeder.run();

    await AdsSeeder.run();

    await NewsletterSeeder.run();
    await ContactsSeeder.run();

    await ApiKeysSeeder.run();
    await AppSettingsSeeder.run();

    await CountersSeeder.run();

    console.log("\n🎉 All seeders executed successfully.\n");
    await displaySummary();
  } catch (error: any) {
    console.error("❌ Seeding failed:", error?.message ?? error);
    process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log("🔐 DB closed");
    }
  }
}

async function displaySummary() {
  console.log("=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));

  const userRepo = AppDataSource.getRepository(User);
  const categoryRepo = AppDataSource.getRepository(Category);
  const articleRepo = AppDataSource.getRepository(Article);
  const adRepo = AppDataSource.getRepository(Ad);

  const authorRepo = AppDataSource.getRepository(ArticleAuthor);
  const mediaRepo = AppDataSource.getRepository(ArticleMedia);
  const likeRepo = AppDataSource.getRepository(ArticleLike);
  const commentRepo = AppDataSource.getRepository(ArticleComment);

  const [users, categories, articles, ads, authors, medias, likes, comments] = await Promise.all([
    userRepo.count(),
    categoryRepo.count(),
    articleRepo.count(),
    adRepo.count(),
    authorRepo.count(),
    mediaRepo.count(),
    likeRepo.count(),
    commentRepo.count(),
  ]);

  console.log(`Users: ${users}`);
  console.log(`Categories: ${categories}`);
  console.log(`Articles: ${articles}`);
  console.log(`ArticleAuthors (pivot): ${authors}`);
  console.log(`Media: ${medias}`);
  console.log(`Likes: ${likes}`);
  console.log(`Comments: ${comments}`);
  console.log(`Ads: ${ads}`);

  console.log("\nTest accounts:");
  console.log("Admin: admin1@blog-alhiwar.com / Admin@2026!");
  console.log("Admin: admin2@blog-alhiwar.com / Admin@2026!");
  console.log("Editor: editor1@blog-alhiwar.com / Editor@2026!");
  console.log("Editor: editor2@blog-alhiwar.com / Editor@2026!");
  console.log("Author: author1@blog-alhiwar.com / Author@2026!");
  console.log("Author: author2@blog-alhiwar.com / Author@2026!");
  console.log("Journalist: journalist1@blog-alhiwar.com / Journalist@2026!");
  console.log("Journalist: journalist2@blog-alhiwar.com / Journalist@2026!");
  console.log("User: user1@blog-alhiwar.com / User@2026!");

  console.log("=".repeat(60));
}

export async function runSpecificSeeder(seederName: string) {
  await AppDataSource.initialize();

  try {
    switch (seederName.toLowerCase()) {
      case "users":
      case "user":
        await UsersSeeder.run();
        break;
      case "categories":
      case "category":
        await CategorySeeder.run();
        break;
      case "articles":
      case "article":
        await ArticlesSeeder.run();
        break;
      case "authors":
      case "articleauthors":
        await ArticleAuthorSeeder.run();
        break;
      case "media":
      case "medias":
        await ArticleMediaSeeder.run();
        break;
      case "likes":
      case "like":
        await ArticleLikeSeeder.run();
        break;
      case "comments":
      case "comment":
        await ArticleCommentSeeder.run();
        break;
      case "ads":
      case "ad":
        await AdsSeeder.run();
        break;
      default:
        console.log(`❌ Seeder not found: ${seederName}`);
    }
  } finally {
    await AppDataSource.destroy();
  }
}

if (require.main === module) {
  const seederName = process.argv[2];
  if (seederName) runSpecificSeeder(seederName);
  else runAllSeeders();
}
