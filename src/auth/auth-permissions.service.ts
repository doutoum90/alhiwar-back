import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { UserRoleLink } from "../entities/user-role.entity";
import { RolePermission } from "../entities/role-permission.entity";

@Injectable()
export class AuthPermissionsService {
  constructor(
    @InjectRepository(UserRoleLink)
    private userRoleRepo: Repository<UserRoleLink>,

    @InjectRepository(RolePermission)
    private rolePermRepo: Repository<RolePermission>,
  ) {}

  async getUserPermissions(userId: string) {
    const links = await this.userRoleRepo.find({
      where: { userId } as any,
      relations: { role: true },
    });

    const roles = Array.from(new Set(links.map((l) => l.role?.key).filter(Boolean)));

    const roleIds = links.map((l) => l.roleId).filter(Boolean);
    if (roleIds.length === 0) return { roles, permissions: [] };

    const rps = await this.rolePermRepo.find({
      where: { roleId: In(roleIds) } as any,
      relations: { permission: true },
    });

    const permissions = Array.from(
      new Set(rps.map((x) => x.permission?.key).filter(Boolean)),
    );

    return { roles, permissions };
  }
}
