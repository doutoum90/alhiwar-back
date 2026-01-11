import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
  BeforeUpdate,
  Index,
} from "typeorm";
import { Exclude } from "class-transformer";
import { Article } from "../entities/article.entity";
import { UserRoleLink } from "../entities/user-role.entity";

export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  JOURNALIST = "journalist",
  EDITOR_IN_CHIEF = "editor",
  AUTHOR = "author",
}

export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
}

export enum UserWorkflowStatus {
  DRAFT = "draft",
  IN_REVIEW = "in_review",
  REJECTED = "rejected",
  PUBLISHED = "published",
  ARCHIVED = "archived",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 150 })
  email: string;

  @Index({ unique: true })
  @Column({ type: "varchar", nullable: true, length: 60 })
  username: string | null;

  @Column({ type: "text", nullable: true })
  bio: string | null;

  @Column({ type: "varchar", nullable: true, length: 40 })
  phone: string | null;

  @Column({ type: "varchar", nullable: true, length: 120 })
  location: string | null;

  @Column({ type: "varchar", nullable: true, length: 200 })
  website: string | null;

  @Column({ type: "varchar", nullable: true, length: 120 })
  company: string | null;

  @Column({ type: "varchar", length: 100 })
  name: string;

  @Exclude({ toPlainOnly: true })
  @Column({ type: "varchar", select: false })
  password: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.AUTHOR,
  })
  role: UserRole;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status: UserStatus;

  @Index()
  @Column({
    type: "enum",
    enum: UserWorkflowStatus,
    default: UserWorkflowStatus.IN_REVIEW,
  })
  workflowStatus: UserWorkflowStatus;

  @Column({ type: "varchar", nullable: true, length: 500 })
  avatar: string | null;

  @Column({ type: "varchar", nullable: true, length: 100 })
  twitterHandle: string | null;

  @Column({ type: "varchar", nullable: true, length: 100 })
  facebookHandle: string | null;

  @Column({ type: "varchar", nullable: true, length: 100 })
  linkedinHandle: string | null;

  @Column({ type: "timestamp", nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: "varchar", nullable: true, length: 45 })
  lastLoginIp: string | null;

  @Column({ type: "int", default: 0 })
  articlesCount: number;

  @Column({ type: "int", default: 0 })
  totalViews: number;

  @Column({ type: "timestamp", nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ type: "varchar", nullable: true, length: 255 })
  emailVerificationToken: string | null;

  @Column({ type: "varchar", nullable: true, length: 255 })
  passwordResetToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpiresAt: Date | null;

  @OneToMany(() => Article, (article) => article.author)
  articles: Article[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ default: false })
  isActive: boolean;

  /* ======================= WORKFLOW META ======================= */

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

  @Column({ default: false })
  isRejected?: boolean;

  @Column({
    type: "jsonb",
    default: () => `'{"email":true,"push":true,"newsletter":false}'::jsonb`,
  })
  notifications: {
    email: boolean;
    push: boolean;
    newsletter: boolean;
  };

  @OneToMany(() => UserRoleLink, (ur) => ur.user)
  roleLinks: UserRoleLink[];

  /* ================= Helpers ================= */

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get isEditor(): boolean {
    return this.role === UserRole.EDITOR_IN_CHIEF || this.isAdmin;
  }

  get isAuthor(): boolean {
    return this.role === UserRole.AUTHOR || this.role === UserRole.JOURNALIST || this.isEditor;
  }

  get displayName(): string {
    return this.name || this.email.split("@")[0];
  }

  get roleLabel(): string {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: "Admin",
      [UserRole.EDITOR_IN_CHIEF]: "Editor-in-chief",
      [UserRole.JOURNALIST]: "Journalist",
      [UserRole.AUTHOR]: "Author",
      [UserRole.USER]: "User",
    };
    return labels[this.role] ?? this.role;
  }

  get statusLabel(): string {
    const labels: Record<UserStatus, string> = {
      [UserStatus.ACTIVE]: "Active",
      [UserStatus.INACTIVE]: "Inactive",
      [UserStatus.SUSPENDED]: "Suspended",
    };
    return labels[this.status];
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail(): void {
    if (this.email) this.email = this.email.toLowerCase().trim();
    if (this.username) this.username = this.username.trim();
    if (this.name) this.name = this.name.trim();
  }
}
