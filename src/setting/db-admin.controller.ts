import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth } from "@nestjs/swagger";

import { DbAdminService } from "./db-admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";


@ApiBearerAuth()
@Controller("settings/db")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DbAdminController {
    constructor(private readonly dbAdminService: DbAdminService) { }

    @RequirePermissions("db.stats.view")
    @Get("/stats")
    async stats() {
        return this.dbAdminService.getStats();
    }

    @RequirePermissions("db.backup")
    @Post("/backup")
    async backup() {
        const res = await this.dbAdminService.backup();
        return { ok: true, backupAt: res.backupAt };
    }

    @RequirePermissions("db.optimize")
    @Post("/optimize")
    async optimize() {
        return this.dbAdminService.optimize();
    }

    @RequirePermissions("db.cleanup_logs")
    @Post("/cleanup-logs")
    async cleanupLogs() {
        return this.dbAdminService.cleanupLogs();
    }
}
