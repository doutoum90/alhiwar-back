import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AppSetting } from "../entities/app-setting.entity";
import { UpdateEmailSettingsDto, UpdateSecuritySettingsDto, UpdateSystemSettingsDto } from "./dto/settings.dto";

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(AppSetting)
    private readonly repo: Repository<AppSetting>,
  ) {}

  private defaults(): AppSetting {
    const s = new AppSetting();
    s.key = "singleton";
    s.system = {
      siteName: "My App",
      siteDescription: "",
      siteUrl: "http://localhost:3000",
      adminEmail: "admin@example.com",
      timezone: "Europe/Paris",
      language: "fr",
      maintenanceMode: false,
      registrationEnabled: true,
      commentsEnabled: true,
      emailVerificationRequired: true,
      maxFileSize: 10,
      articlesPerPage: 20,
      sessionTimeout: 30,
    };
    s.email = {
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPassword: null,
      senderName: "",
      senderEmail: "",
      enableSSL: true,
    };
    s.security = {
      passwordMinLength: 8,
      requireSpecialChars: true,
      sessionDuration: 24,
      maxLoginAttempts: 5,
      twoFactorEnabled: false,
      ipWhitelist: [],
    };
    return s;
  }

  async getOrCreateSingleton(): Promise<AppSetting> {
    let row = await this.repo.findOne({ where: { key: "singleton" } });
    if (!row) {
      row = this.defaults();
      row = await this.repo.save(row);
    }
    return row;
  }

  async getAll() {
    const row = await this.getOrCreateSingleton();

    // IMPORTANT: on peut masquer smtpPassword côté API (optionnel)
    const emailSafe = { ...row.email, smtpPassword: row.email.smtpPassword ? null : null };

    return {
      system: row.system,
      email: emailSafe,
      security: row.security,
    };
  }

  async updateSystem(dto: UpdateSystemSettingsDto) {
    const row = await this.getOrCreateSingleton();
    row.system = { ...row.system, ...dto };
    const saved = await this.repo.save(row);
    return saved.system;
  }

  async updateEmail(dto: UpdateEmailSettingsDto) {
    const row = await this.getOrCreateSingleton();

    // si smtpPassword est undefined => pas de changement
    // si "" (vide) => pas de changement (pratique côté UI)
    const next = { ...row.email, ...dto } as any;
    if (dto.smtpPassword === undefined || dto.smtpPassword === "") {
      next.smtpPassword = row.email.smtpPassword;
    }

    row.email = next;
    const saved = await this.repo.save(row);

    // masquer le password
    return { ...saved.email, smtpPassword: null };
  }

  async updateSecurity(dto: UpdateSecuritySettingsDto) {
    const row = await this.getOrCreateSingleton();
    row.security = { ...row.security, ...dto };
    const saved = await this.repo.save(row);
    return saved.security;
  }
}
