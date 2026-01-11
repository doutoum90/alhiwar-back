import { SetMetadata } from "@nestjs/common";
export const PERMS_KEY = "required_permissions";
export const RequirePermissions = (...perms: string[]) => SetMetadata(PERMS_KEY, perms);
