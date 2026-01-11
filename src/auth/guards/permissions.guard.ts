import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMS_KEY } from "../decorators/require-permissions.decorator";

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(ctx: ExecutionContext): boolean {
        const required = this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);

        if (!required || required.length === 0) return true;

        const req = ctx.switchToHttp().getRequest();
        const user = req.user;

        const userPerms: string[] = Array.isArray(user?.permissions) ? user.permissions : [];
        const ok = required.every((p) => userPerms.includes(p)); // ✅ AND

        if (!ok) throw new ForbiddenException("Permission refusée");
        return true;
    }
}
