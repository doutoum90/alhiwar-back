import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, ILike } from "typeorm";
import { randomHex } from "src/utils/crypto";
import { SubscribeNewsletterDto } from "./dto/subscribe-newsletter.dto";
import { AdminUpdateNewsletterDto } from "./dto/admin-update-newsletter.dto";
import { NewsletterSubscription } from "../entities/newsletter_subscription.entity";
import * as nodemailer from "nodemailer";


type Paged<T> = { items: T[]; total: number; page: number; limit: number; pages: number };

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    @InjectRepository(NewsletterSubscription)
    private repo: Repository<NewsletterSubscription>
  ) { }

  async getStatistics() {
    const total = await this.repo.count();
    const active = await this.repo.count({ where: { isActive: true } });
    const verified = await this.repo.count({ where: { isVerified: true } });

    const monthly = await this.repo
      .createQueryBuilder("n")
      .select("DATE_TRUNC('month', n.createdAt)", "month")
      .addSelect("COUNT(*)::int", "count")
      .where("n.createdAt >= NOW() - INTERVAL '12 months'")
      .groupBy("DATE_TRUNC('month', n.createdAt)")
      .orderBy("month", "DESC")
      .getRawMany();

    return {
      total,
      active,
      inactive: total - active,
      verified,
      unverified: total - verified,
      monthly,
    };
  }

  private makeToken(len = 32) {
    return randomHex(len);
  }

  private async sendVerifyEmail(email: string, verifyUrl: string, unsubscribeUrl: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE ?? "false") === "true";

    const fromName = process.env.SMTP_FROM_NAME ?? "Newsletter";
    const fromEmail = process.env.SMTP_FROM_EMAIL ?? "no-reply@example.com";

    if (!host || !user || !pass) {
      this.logger.warn("SMTP not configured. Skipping newsletter verification email.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const subject = "Confirmez votre inscription à la newsletter";

    const text = [
      `Bonjour,`,
      ``,
      `Merci pour votre inscription à notre newsletter.`,
      `Confirmez votre inscription ici : ${verifyUrl}`,
      ``,
      `Lien de désinscription : ${unsubscribeUrl}`,
      ``,
      `Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    ].join("\n");

    const html = `
  <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;line-height:1.5">
    <h2 style="margin:0 0 12px">Confirmez votre inscription</h2>
    <p style="margin:0 0 18px">
      Merci pour votre inscription à la newsletter. Cliquez sur le bouton ci-dessous pour confirmer.
    </p>

    <p style="margin:24px 0">
      <a href="${verifyUrl}"
         style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700">
        ✅ Confirmer mon inscription
      </a>
    </p>

    <p style="margin:0 0 10px;color:#6b7280;font-size:14px">
      Si le bouton ne fonctionne pas, copiez-collez ce lien :
      <br/>
      <a href="${verifyUrl}">${verifyUrl}</a>
    </p>

    <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>

    <p style="margin:0;color:#6b7280;font-size:13px">
      Vous pouvez vous désinscrire à tout moment :
      <a href="${unsubscribeUrl}">Se désinscrire</a>
    </p>
  </div>
  `;

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: email,
      subject,
      text,
      html,
    });
  }


  async subscribe(dto: SubscribeNewsletterDto) {
    const email = dto.email.trim().toLowerCase();
    const now = new Date();

    const existing = await this.repo.findOne({ where: { email } });

    if (existing?.isActive && existing.isVerified) {
      throw new ConflictException("Vous êtes déjà inscrit à la newsletter.");
    }

    const verifyToken = this.makeToken(24);
    const unsubscribeToken = existing?.unsubscribeToken ?? this.makeToken(24);
    const verifyTokenExpiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 24);

    if (existing) {
      existing.isActive = true;
      existing.isVerified = false;
      existing.verifyToken = verifyToken;
      existing.verifyTokenExpiresAt = verifyTokenExpiresAt;
      existing.unsubscribeToken = unsubscribeToken;
      await this.repo.save(existing);
    } else {
      const row = this.repo.create({
        email,
        isActive: true,
        isVerified: false,
        verifyToken,
        verifyTokenExpiresAt,
        unsubscribeToken,
      });
      await this.repo.save(row);
    }

    const verifyUrl = `${process.env.PUBLIC_WEB_URL}/newsletter/verify?token=${encodeURIComponent(verifyToken)}`;
    const unsubscribeUrl = `${process.env.PUBLIC_WEB_URL}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;

    await this.sendVerifyEmail(email, verifyUrl, unsubscribeUrl);

    return {
      ok: true,
      message: "Merci ! Vérifiez votre email pour confirmer l’inscription.",
    };
  }

  async verify(token: string) {
    if (!token) throw new BadRequestException("Token manquant.");

    const sub = await this.repo.findOne({ where: { verifyToken: token } });
    if (!sub) throw new NotFoundException("Token invalide.");

    if (!sub.verifyTokenExpiresAt || sub.verifyTokenExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Token expiré. Veuillez vous réinscrire.");
    }

    sub.isVerified = true;
    sub.isActive = true;
    sub.verifyToken = null;
    sub.verifyTokenExpiresAt = null;
    await this.repo.save(sub);

    return { ok: true, message: "Inscription confirmée. Merci !" };
  }

  async unsubscribeByToken(token: string) {
    if (!token) throw new BadRequestException("Token manquant.");

    const sub = await this.repo.findOne({ where: { unsubscribeToken: token } });
    if (!sub) throw new NotFoundException("Token invalide.");

    sub.isActive = false;
    await this.repo.save(sub);

    return { ok: true, message: "Vous êtes désinscrit de la newsletter." };
  }

  async unsubscribeByEmail(email: string) {
    const v = (email ?? "").trim().toLowerCase();
    if (!v) throw new BadRequestException("Email manquant.");

    const sub = await this.repo.findOne({ where: { email: v } });
    if (!sub) throw new NotFoundException("Email introuvable.");

    sub.isActive = false;
    await this.repo.save(sub);

    return { ok: true, message: "Vous êtes désinscrit de la newsletter." };
  }

  async adminList(params: { q?: string; status?: string; page?: number; limit?: number }): Promise<Paged<NewsletterSubscription>> {
    const page = Math.max(1, Number(params.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(params.limit ?? 20)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.q?.trim()) where.email = ILike(`%${params.q.trim()}%`);

    if (params.status === "active") where.isActive = true;
    if (params.status === "inactive") where.isActive = false;
    if (params.status === "verified") where.isVerified = true;
    if (params.status === "unverified") where.isVerified = false;

    const [items, total] = await this.repo.findAndCount({
      where,
      order: { createdAt: "DESC" },
      take: limit,
      skip,
    });

    return { items, total, page, limit, pages: Math.ceil(total / limit) };
  }

  async adminUpdate(id: string, dto: AdminUpdateNewsletterDto) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException("Abonné introuvable.");

    if (dto.isActive !== undefined) sub.isActive = dto.isActive;
    if (dto.isVerified !== undefined) sub.isVerified = dto.isVerified;

    await this.repo.save(sub);
    return sub;
  }

  async adminRemove(id: string) {
    const sub = await this.repo.findOne({ where: { id } });
    if (!sub) throw new NotFoundException("Abonné introuvable.");
    await this.repo.remove(sub);
    return { ok: true };
  }
}
