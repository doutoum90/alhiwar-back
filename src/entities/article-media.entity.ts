import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index, CreateDateColumn, JoinColumn } from "typeorm";
import { Article } from "../entities/article.entity";

export enum MediaType {
  IMAGE = "image",
  VIDEO = "video",
  PDF = "pdf",
}

@Entity("article_media")
export class ArticleMedia {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index()
  @Column({ type: "uuid" })
  articleId: string;

  @ManyToOne(() => Article, (a) => a.media, { onDelete: "CASCADE" })
  @JoinColumn({ name: "articleId" })
  article: Article;

  @Column({ type: "enum", enum: MediaType })
  type: MediaType;

  @Column({ type: "varchar", length: 800 })
  url: string;

  @Column({ type: "varchar", length: 300, nullable: true })
  title: string | null;
  
  @Column({ default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;
}
