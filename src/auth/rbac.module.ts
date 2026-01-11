import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Permission } from "../entities/permission.entity";
import { RolePermission } from "../entities/role-permission.entity";
import { Role } from "../entities/role.entity";
import { UserRoleLink } from "../entities/user-role.entity";

@Module({
    imports: [TypeOrmModule.forFeature([Role, Permission, RolePermission, UserRoleLink])],
    exports: [TypeOrmModule],
})
export class RbacModule { }
