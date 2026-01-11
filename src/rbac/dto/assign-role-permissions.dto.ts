import { IsArray, IsString, ArrayMaxSize, ArrayUnique } from "class-validator";

export class AssignRolePermissionsDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  @ArrayMaxSize(500)
  permissionKeys!: string[];
}
