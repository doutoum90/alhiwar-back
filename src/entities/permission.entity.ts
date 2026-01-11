import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from "typeorm";
import { RolePermission } from "./role-permission.entity";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 200, unique: true })
  key: string; // ex: "articles.create"

  @Column({ type: "varchar", length: 255, nullable: true })
  label?: string | null;

  // ✅ relation pivot (optionnelle mais propre)
  @OneToMany(() => RolePermission, (rp) => rp.permission)
  rolePermissions: RolePermission[];
}
