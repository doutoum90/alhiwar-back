import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return false;

    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>("roles", [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    const requiredPerms =
      this.reflector.getAllAndOverride<string[]>("permissions", [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    if (requiredRoles.length === 0 && requiredPerms.length === 0) return true;

    const userRoles: string[] = [
      ...(user.roles ?? []),
      ...(user.role ? [user.role] : []),
    ].map(String);

    const userPerms: string[] = (user.permissions ?? []).map(String);

    if (requiredRoles.length > 0) {
      const okRole = requiredRoles.some((r) => userRoles.includes(String(r)));
      if (!okRole) return false;
    }

    if (requiredPerms.length > 0) {
      const okPerm = requiredPerms.every((p) => userPerms.includes(String(p)));
      if (!okPerm) return false;
    }

    return true;
  }
}
