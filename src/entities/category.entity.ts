import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from "typeorm";
import { Article } from "../entities/article.entity";

export enum CategoryStatus {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  REJECTED = "rejected",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

@Entity("categories")
export class Category {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 500, unique: true })
  slug: string;

  @Column({ type: "text", nullable: true })
  description?: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  image?: string | null;

  @Column({ type: "varchar", length: 7, nullable: true })
  color?: string | null;

  @Column({ type: "int", default: 0 })
  sortOrder: number;

  @OneToMany(() => Article, (article) => article.category)
  articles: Article[];

  @Index()
  @Column({ type: "enum", enum: CategoryStatus, default: CategoryStatus.DRAFT })
  status: CategoryStatus;

  @Index()
  @Column({ type: "uuid", nullable: true })
  createdById?: string | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  submittedById?: string | null;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  submittedAt?: Date | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  reviewedById?: string | null;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: "text", nullable: true })
  reviewComment?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
