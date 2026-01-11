import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export type SystemSettings = {
  siteName: string;
  siteDescription: string;
  siteUrl: string;
  adminEmail: string;
  timezone: string;
  language: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  commentsEnabled: boolean;
  emailVerificationRequired: boolean;
  maxFileSize: number;
  articlesPerPage: number;
  sessionTimeout: number;
};

export type EmailSettings = {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string | null;
  senderName: string;
  senderEmail: string;
  enableSSL: boolean;
};

export type SecuritySettings = {
  passwordMinLength: number;
  requireSpecialChars: boolean;
  sessionDuration: number;
  maxLoginAttempts: number;
  twoFactorEnabled: boolean;
  ipWhitelist: string[];
};

@Entity("app_settings")
export class AppSetting {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 40, default: "singleton" })
  key: string;

  @Column({ type: "jsonb" })
  system: SystemSettings;

  @Column({ type: "jsonb" })
  email: EmailSettings;

  @Column({ type: "jsonb" })
  security: SecuritySettings;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
