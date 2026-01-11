import { config } from "dotenv";
config();

import "reflect-metadata";
import { DataSource } from "typeorm";

import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { UserRoleLink } from "../entities/user-role.entity";

import { Category } from "../entities/category.entity";
import { Article } from "../entities/article.entity";
import { Ad } from "../entities/ad.entity";

import { Contact } from "../entities/contact.entity";
import { NewsletterSubscription } from "../entities/newsletter_subscription.entity";
import { ApiKey } from "../entities/api-key.entity";
import { AppSetting } from "../entities/app-setting.entity";

import { ArticleAuthor } from "../entities/article-author.entity";
import { ArticleMedia } from "../entities/article-media.entity";
import { ArticleLike } from "../entities/article-like.entity";
import { ArticleComment } from "../entities/article-comment.entity";

const isProd = process.env.NODE_ENV === "production";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 5434),
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_DATABASE || "alhiwar",

  entities: [
    User,
    Role,
    Permission,
    RolePermission,
    UserRoleLink,

    Category,
    Article,
    Ad,

    Contact,
    NewsletterSubscription,
    ApiKey,
    AppSetting,

    ArticleAuthor,
    ArticleMedia,
    ArticleLike,
    ArticleComment,
  ],

  migrations: [
    isProd ? "dist/database/migrations/*.js" : "src/database/migrations/*.ts",
  ],
  migrationsTableName: "migrations",

  synchronize: false,
  logging: ["error", "migration"],
});
