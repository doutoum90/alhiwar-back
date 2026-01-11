import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Role } from "../entities/role.entity";
import { Permission } from "../entities/permission.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { User } from "../entities/user.entity";
import { UserRoleLink } from "../entities/user-role.entity";

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Permission) private permRepo: Repository<Permission>,
    @InjectRepository(RolePermission) private rpRepo: Repository<RolePermission>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(UserRoleLink) private urRepo: Repository<UserRoleLink>,
  ) {}

  listRoles() {
    return this.roleRepo.find({ order: { key: "ASC" as any } });
  }

  listPermissions() {
    return this.permRepo.find({ order: { key: "ASC" as any } });
  }

  async getRolePermissions(roleId: string) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role introuvable");

    const links = await this.rpRepo.find({
      where: { roleId },
      relations: ["permission"],
    });

    return {
      roleId: role.id,
      roleKey: role.key,
      permissions: links
        .map((x) => x.permission)
        .filter(Boolean)
        .map((p) => ({
          id: p.id,
          key: p.key,
          label: p.label ?? null,
          group: (p as any).group ?? null,
        })),
    };
  }

  async assignRolePermissions(roleId: string, permissionKeys: string[]) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role introuvable");

    const keys = Array.from(new Set((permissionKeys ?? []).map((s) => String(s).trim()).filter(Boolean)));

    const perms = keys.length
      ? await this.permRepo.find({ where: { key: In(keys) } })
      : [];

    await this.rpRepo.delete({ roleId });

    if (perms.length) {
      await this.rpRepo.save(
        perms.map((p) => this.rpRepo.create({ roleId: role.id, permissionId: p.id })),
      );
    }

    return { ok: true, roleId: role.id, count: perms.length };
  }

  async removeRolePermission(roleId: string, permissionId: string) {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException("Role introuvable");

    await this.rpRepo.delete({ roleId, permissionId });
    return { ok: true };
  }

  async getUserRoles(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const links = await this.urRepo.find({
      where: { userId },
      relations: ["role"],
    });

    return {
      userId: user.id,
      roles: links
        .map((x) => x.role)
        .filter(Boolean)
        .map((r) => ({ id: r.id, key: r.key, name: r.name })),
    };
  }

  async assignUserRoles(userId: string, roleKeys: string[]) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const keys = Array.from(new Set((roleKeys ?? []).map((s) => String(s).trim()).filter(Boolean)));
    const roles = keys.length ? await this.roleRepo.find({ where: { key: In(keys) } }) : [];

    await this.urRepo.delete({ userId });

    if (roles.length) {
      await this.urRepo.save(
        roles.map((r) => this.urRepo.create({ userId: user.id, roleId: r.id })),
      );
    }

    return { ok: true, userId: user.id, count: roles.length };
  }
}
