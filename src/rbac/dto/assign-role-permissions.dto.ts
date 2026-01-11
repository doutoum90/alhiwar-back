import { IsArray, IsString, ArrayMaxSize, ArrayUnique } from "class-validator";

export class AssignRolePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @ArrayMaxSize(500) // optionnel: limite anti-abus
  permissionKeys!: string[];
}

export class AssignUserRolesDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  roleKeys!: string[];
}
