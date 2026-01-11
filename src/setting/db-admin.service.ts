import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { execFile } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as fs from "fs";

const execFileAsync = promisify(execFile);

@Injectable()
export class DbAdminService {
  constructor(private readonly dataSource: DataSource) {}

  async getStats() {
    const sizeRow = await this.dataSource.query(
      `SELECT pg_database_size(current_database()) AS size_bytes;`
    );
    const sizeBytes = Number(sizeRow?.[0]?.size_bytes ?? 0);
    const totalSizeMb = Math.round((sizeBytes / (1024 * 1024)) * 10) / 10;

    const [articlesRow] = await this.dataSource.query(`SELECT COUNT(*)::int AS c FROM articles;`).catch(() => [{ c: 0 }]);
    const [usersRow] = await this.dataSource.query(`SELECT COUNT(*)::int AS c FROM users;`).catch(() => [{ c: 0 }]);

    const lastBackupAt = process.env.LAST_BACKUP_AT || null;

    return {
      totalSizeMb,
      totalArticles: Number(articlesRow?.c ?? 0),
      totalUsers: Number(usersRow?.c ?? 0),
      lastBackupAt,
      status: "healthy" as const,
    };
  }

  async backup(): Promise<{ ok: true; backupAt: string; file: string }> {
    const DB_HOST = process.env.DB_HOST || "127.0.0.1";
    const DB_PORT = process.env.DB_PORT || "5432";
    const DB_USERNAME = process.env.DB_USERNAME || "postgres";
    const DB_PASSWORD = process.env.DB_PASSWORD || "postgres";
    const DB_DATABASE = process.env.DB_DATABASE || "postgres";

    const backupDir = process.env.DB_BACKUP_DIR || path.join(process.cwd(), "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const backupAt = new Date().toISOString();
    const file = path.join(backupDir, `${DB_DATABASE}_${backupAt.replace(/[:.]/g, "-")}.dump`);

    await execFileAsync(
      "pg_dump",
      ["-h", DB_HOST, "-p", DB_PORT, "-U", DB_USERNAME, "-Fc", "-f", file, DB_DATABASE],
      {
        env: { ...process.env, PGPASSWORD: DB_PASSWORD },
      }
    );

    process.env.LAST_BACKUP_AT = backupAt;

    return { ok: true, backupAt, file };
  }

  async optimize(): Promise<{ ok: true }> {
    await this.dataSource.query(`VACUUM (ANALYZE);`).catch(async () => {
      await this.dataSource.query(`ANALYZE;`);
    });
    return { ok: true };
  }

  async cleanupLogs(): Promise<{ ok: true }> {
    await this.dataSource
      .query(`DELETE FROM audit_logs WHERE "createdAt" < NOW() - INTERVAL '30 days';`)
      .catch(() => null);

    return { ok: true };
  }
}
