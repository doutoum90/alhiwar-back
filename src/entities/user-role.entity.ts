import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Column, Index } from "typeorm";
import { User } from "../entities/user.entity";
import { Role } from "../entities/role.entity";

@Entity("user_roles")
@Index(["userId", "roleId"], { unique: true })
export class UserRoleLink {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column({ type: "uuid" })
  roleId: string;

  @ManyToOne(() => User, (u) => u.roleLinks, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Role, { eager: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "roleId" })
  role: Role;
}
