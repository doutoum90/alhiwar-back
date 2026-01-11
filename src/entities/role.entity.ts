// src/entities/role.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from "typeorm";
import { RolePermission } from "./role-permission.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 80, unique: true })
  key: string;

  @Column({ type: "varchar", length: 120 })
  name: string;

  // ✅ pivot
  @OneToMany(() => RolePermission, (rp) => rp.role, { cascade: true })
  rolePermissions: RolePermission[];
}
