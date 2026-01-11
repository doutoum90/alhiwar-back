import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum AdType {
  BANNER = "banner",
  SIDEBAR = "sidebar",
  POPUP = "popup",
  INLINE = "inline",
}

export enum AdWorkflowStatus {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  REJECTED = "rejected",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

@Entity("ads")
export class Ad {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: "text" })
  content: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  image: string | null;

  @Column({ type: "varchar", length: 500, nullable: true })
  link: string | null;

  @Column({ default: 0 })
  views: number;

  @Column({ default: 0 })
  clicks: number;

  @Column({ default: 0 })
  impressions: number;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  clickThroughRate: number;

  @Column({ type: "decimal", precision: 10, scale: 2, default: 0 })
  totalRevenue: number;

  @Column({
    type: "enum",
    enum: AdType,
    default: AdType.BANNER,
  })
  type: AdType;

  @Index()
  @Column({
    type: "enum",
    enum: AdWorkflowStatus,
    default: AdWorkflowStatus.DRAFT,
  })
  status: AdWorkflowStatus;

  @Column({ type: "timestamp", nullable: true })
  startDate: Date | null;

  @Column({ type: "timestamp", nullable: true })
  endDate: Date | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  createdById: string | null;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  submittedAt: Date | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  submittedById: string | null;

  @Index()
  @Column({ type: "timestamp", nullable: true })
  reviewedAt: Date | null;

  @Index()
  @Column({ type: "uuid", nullable: true })
  reviewedById: string | null;

  @Column({ type: "text", nullable: true })
  reviewComment: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  get ctr(): number {
    return this.impressions > 0 ? (this.clicks / this.impressions) * 100 : 0;
  }

  get isPublishedAndInDateWindow(): boolean {
    if (this.status !== AdWorkflowStatus.PUBLISHED) return false;

    const now = new Date();
    const started = !this.startDate || this.startDate <= now;
    const notEnded = !this.endDate || this.endDate >= now;

    return started && notEnded;
  }

  get formattedCtr(): string {
    return `${this.ctr.toFixed(2)}%`;
  }
}
