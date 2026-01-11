// src/rbac/dto/assign-user-roles.dto.ts
import { IsArray, IsOptional, IsString, ArrayMinSize } from "class-validator";

export class AssignUserRolesDto {
    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    roleIds?: string[];

    @IsOptional()
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    roleKeys?: string[];
}
