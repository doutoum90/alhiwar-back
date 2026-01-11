import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

@Entity("newsletter_subscriptions")
export class NewsletterSubscription {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ length: 320 })
  email: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Index()
  @Column({ type: "varchar", length: 128, nullable: true })
  verifyToken: string | null;

  @Column({ type: "timestamp", nullable: true })
  verifyTokenExpiresAt: Date | null;

  @Index()
  @Column({ type: "varchar", length: 128, nullable: true })
  unsubscribeToken: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
