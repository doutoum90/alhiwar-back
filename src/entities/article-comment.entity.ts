import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  JoinColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../entities/user.entity";
import { Article } from "../entities/article.entity";

export type CommentStatus = "visible" | "pending" | "hidden";

@Entity("article_comments")
export class ArticleComment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  articleId: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  userId: string | null;

  @ManyToOne(() => User, (u) => (u as any).articleComments, { nullable: true, onDelete: "SET NULL" })
  user?: User | null;

  @ManyToOne(() => Article, (a) => (a as any).comments, { onDelete: "CASCADE" })
  @JoinColumn({ name: "articleId" })
  article: Article;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "varchar", length: 120, nullable: true })
  guestName: string | null;

  @Column({ type: "varchar", length: 180, nullable: true })
  guestEmail: string | null;

  @Column({ type: "varchar", length: 20, default: "visible" })
  status: CommentStatus;

  @Column({ type: "boolean", default: false })
  isHidden: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
