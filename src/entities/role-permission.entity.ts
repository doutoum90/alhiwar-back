// src/entities/role-permission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from "typeorm";
import { Role } from "./role.entity";
import { Permission } from "./permission.entity";

@Entity("role_permissions")
@Index(["roleId", "permissionId"], { unique: true })
export class RolePermission {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "uuid" })
    roleId: string;

    @ManyToOne(() => Role, (r) => r.rolePermissions, { onDelete: "CASCADE" })
    @JoinColumn({ name: "roleId" })
    role: Role;

    @Column({ type: "uuid" })
    permissionId: string;

    // ✅ soit eager true, soit relations: ["permission"] dans le find()
    @ManyToOne(() => Permission, (p) => p.rolePermissions, { onDelete: "CASCADE", eager: true })
    @JoinColumn({ name: "permissionId" })
    permission: Permission;
}
