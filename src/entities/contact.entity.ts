import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('contacts')
export class Contact {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 150 })
  email: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: "timestamp", nullable: true })
  archivedAt: Date | null;

  @Column({ nullable: true, length: 50 })
  subject?: string;

  @Column({ nullable: true, length: 20 })
  phone?: string;

  @Column({ nullable: true, length: 100 })
  company?: string;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ nullable: true, length: 500 })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Méthode utilitaire pour formater la date
  get formattedDate(): string {
    return this.createdAt.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  // Méthode pour obtenir un extrait du message
  get messageExcerpt(): string {
    if (this.message.length <= 100) return this.message;
    return this.message.substring(0, 100) + '...';
  }
}