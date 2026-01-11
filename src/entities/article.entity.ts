import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from "typeorm";
import { User } from "../entities/user.entity";
import { Category } from "../entities/category.entity";
import { ArticleMedia } from "../entities/article-media.entity";
import { ArticleLike } from "../entities/article-like.entity";
import { ArticleComment } from "../entities/article-comment.entity";
import { ArticleAuthor } from "../entities/article-author.entity";

export type ArticleStatus =
  | "draft"
  | "in_review"
  | "rejected"
  | "published"
  | "archived";

@Entity("articles")
export class Article {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 220 })
  title: string;

  @Index({ unique: true })
  @Column({ length: 300 })
  slug: string;

  @Column({ type: "text", nullable: true })
  excerpt: string | null;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "varchar", default: "draft" })
  status: ArticleStatus;

  @Column({ type: "uuid" })
  authorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: "authorId" })
  author: User;

  @Column({ type: "uuid" })
  categoryId: string;

  @ManyToOne(() => Category, { eager: false })
  @JoinColumn({ name: "categoryId" })
  category: Category;

  @Column({ type: "text", array: true, default: () => "ARRAY[]::text[]" })
  tags: string[];

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column({ type: "timestamp", nullable: true })
  publishedAt: Date | null;

  /* ================= Review workflow ================= */

  @Column({ type: "timestamp", nullable: true })
  submittedAt: Date | null;

  @Column({ type: "uuid", nullable: true })
  submittedById: string | null;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt: Date | null;

  @Column({ type: "uuid", nullable: true })
  reviewedById: string | null;

  @Column({ type: "text", nullable: true })
  reviewComment: string | null;

  /* ==================================================== */

  @OneToMany(() => ArticleMedia, (m) => m.article, { cascade: true })
  media: ArticleMedia[];

  @OneToMany(() => ArticleLike, (l) => l.article)
  likes: ArticleLike[];

  @OneToMany(() => ArticleComment, (c) => c.article)
  comments: ArticleComment[];

  @OneToMany(() => ArticleAuthor, (a) => a.article)
  authors: ArticleAuthor[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
