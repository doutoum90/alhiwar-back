import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Article } from "../entities/article.entity";
import { User } from "../entities/user.entity";

@Entity("article_authors")
@Index(["articleId", "userId"], { unique: true })
export class ArticleAuthor {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  articleId: string;

  @ManyToOne(() => Article, (a) => a.authors, { onDelete: "CASCADE" })
  @JoinColumn({ name: "articleId" })
  article: Article;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ default: false })
  isMain: boolean;
}
