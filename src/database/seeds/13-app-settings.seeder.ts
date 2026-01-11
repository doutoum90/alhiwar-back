import { AppDataSource } from "../data-source";
import { AppSetting, SystemSettings, EmailSettings, SecuritySettings } from "../../entities/app-setting.entity";

export class AppSettingsSeeder {
    public static async run(): Promise<void> {
        console.log("⚙️ Seeding app_settings (singleton)...");

        const repo = AppDataSource.getRepository(AppSetting);

        const system: SystemSettings = {
            siteName: "Alhiwar",
            siteDescription: "Plateforme d’actualités et d’analyses",
            siteUrl: process.env.PUBLIC_WEB_URL || "http://localhost:5173",
            adminEmail: process.env.SMTP_FROM_EMAIL || "no-reply@bloginfo.com",
            timezone: "Africa/Ndjamena",
            language: "fr",
            maintenanceMode: false,
            registrationEnabled: true,
            commentsEnabled: true,
            emailVerificationRequired: true,
            maxFileSize: 50, // MB (cohérent avec uploads 50MB dans articles)
            articlesPerPage: 10,
            sessionTimeout: 60, // minutes
        };

        const email: EmailSettings = {
            smtpHost: process.env.SMTP_HOST || "smtp.mailtrap.io",
            smtpPort: Number(process.env.SMTP_PORT || 587),
            smtpUser: process.env.SMTP_USER || "xxxx",
            smtpPassword: process.env.SMTP_PASS || null,
            senderName: process.env.SMTP_FROM_NAME || "Blog Info",
            senderEmail: process.env.SMTP_FROM_EMAIL || "no-reply@bloginfo.com",
            enableSSL: String(process.env.SMTP_SECURE || "false") === "true",
        };

        const security: SecuritySettings = {
            passwordMinLength: 8,
            requireSpecialChars: true,
            sessionDuration: 60 * 60 * 24, // seconds (1 day)
            maxLoginAttempts: 10,
            twoFactorEnabled: false,
            ipWhitelist: [], // optionnel
        };

        const key = "singleton";

        const existing = await repo.findOne({ where: { key } });

        if (!existing) {
            const entity = repo.create({ key, system, email, security });
            await repo.save(entity);
            console.log("  ✅ Created app_settings singleton\n");
        } else {
            existing.system = system;
            existing.email = email;
            existing.security = security;
            await repo.save(existing);
            console.log("  🔁 Updated app_settings singleton\n");
        }
    }
}
