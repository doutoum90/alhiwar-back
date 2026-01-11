// roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    // 👇 IMPORTANT : si pas connecté, on laisse JwtAuthGuard gérer (401)
    if (!user) return false;

    // roles requis via @Roles(...)
    const requiredRoles =
      this.reflector.getAllAndOverride<string[]>("roles", [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    // permissions requises via @Permissions(...) si tu as ça
    const requiredPerms =
      this.reflector.getAllAndOverride<string[]>("permissions", [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    // ✅ AUCUNE contrainte => autoriser
    if (requiredRoles.length === 0 && requiredPerms.length === 0) return true;

    const userRoles: string[] = [
      ...(user.roles ?? []),        // RBAC roles keys
      ...(user.role ? [user.role] : []), // old single role
    ].map(String);

    const userPerms: string[] = (user.permissions ?? []).map(String);

    // ✅ role match
    if (requiredRoles.length > 0) {
      const okRole = requiredRoles.some((r) => userRoles.includes(String(r)));
      if (!okRole) return false;
    }

    // ✅ permissions match
    if (requiredPerms.length > 0) {
      const okPerm = requiredPerms.every((p) => userPerms.includes(String(p)));
      if (!okPerm) return false;
    }

    return true;
  }
}
