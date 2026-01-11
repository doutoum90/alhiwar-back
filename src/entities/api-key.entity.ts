import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("api_keys")
export class ApiKey {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 120 })
  name: string;

  // exemple: "ak_live_2f9c..." (on stocke prefix pour afficher sans exposer le secret)
  @Index()
  @Column({ length: 32 })
  prefix: string;

  // hash du secret (pas le secret lui-même)
  @Column({ type: "text" })
  keyHash: string;

  @Column({ type: "simple-array", default: "" })
  permissions: string[];

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: "timestamp", nullable: true })
  lastUsedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
