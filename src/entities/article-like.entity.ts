import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from "typeorm";
import { Article } from "../entities/article.entity";
import { User } from "../entities/user.entity";

@Entity("article_likes")
@Index(["articleId", "userId"], { unique: true })
export class ArticleLike {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  articleId: string;

  @ManyToOne(() => Article, (a) => a.likes, { onDelete: "CASCADE" })
  @JoinColumn({ name: "articleId" })
  article: Article;

  @Column({ type: "uuid" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}
