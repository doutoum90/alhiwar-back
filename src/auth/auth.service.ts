import { Injectable, UnauthorizedException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import { cutoffFromPeriod } from "src/stats/period";
import { randomHex } from "src/utils/crypto";
import { createHash } from "crypto";
import * as nodemailer from "nodemailer";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) { }



  async getAuthStats(period?: string) {
    const cutoff = cutoffFromPeriod(period);

    const registrationsRow = await this.userRepository
      .createQueryBuilder("u")
      .select("COUNT(*)::int", "c")
      .where("u.createdAt >= :cutoff", { cutoff })
      .getRawOne();

    const loginsRow = await this.userRepository
      .createQueryBuilder("u")
      .select("COUNT(*)::int", "c")
      .where("u.lastLoginAt IS NOT NULL")
      .andWhere("u.lastLoginAt >= :cutoff", { cutoff })
      .getRawOne();

    const activeUsersRow = await this.userRepository
      .createQueryBuilder("u")
      .select("COUNT(*)::int", "c")
      .where("u.isActive = true")
      .getRawOne();

    return {
      registrationsInPeriod: Number(registrationsRow?.c ?? 0),
      loginsInPeriod: Number(loginsRow?.c ?? 0),
      activeUsers: Number(activeUsersRow?.c ?? 0),
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id', 'name', 'email', 'role', 'status', 'avatar', 'bio',
        'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'
      ]
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: Partial<User>): Promise<User> {

    const { password, role, status, isActive, ...allowedUpdates } = updateData;

    await this.userRepository.update(userId, allowedUpdates);
    return this.findById(userId);
  }

  async generatePasswordResetToken(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) return;

    const resetToken = randomHex(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.userRepository.update(user.id, {
      passwordResetToken: this.hashToken(resetToken),
      passwordResetExpiresAt: expiresAt,
    });

    const resetUrl = `${this.publicWebUrl()}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;
    await this.sendEmail(
      user.email,
      "Réinitialisation de mot de passe",
      [
        "Bonjour,",
        "",
        "Vous avez demandé la réinitialisation de votre mot de passe.",
        `Cliquez sur ce lien pour continuer : ${resetUrl}`,
        "",
        "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
      ].join("\n"),
      `<p>Bonjour,</p>
       <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
       <p><a href="${resetUrl}">Réinitialiser mon mot de passe</a></p>
       <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>`
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user =
      (await this.userRepository.findOne({
        where: { passwordResetToken: this.hashToken(token) }
      })) ||
      (await this.userRepository.findOne({
        where: { passwordResetToken: token }
      }));

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new UnauthorizedException('رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user =
      (await this.userRepository.findOne({
        where: { emailVerificationToken: this.hashToken(token) }
      })) ||
      (await this.userRepository.findOne({
        where: { emailVerificationToken: token }
      }));

    if (!user) {
      throw new UnauthorizedException('رمز التحقق من البريد الإلكتروني غير صالح');
    }

    await this.userRepository.update(user.id, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
    });
  }

  private generateVerificationToken(): string {
    return randomHex(32);
  }

  private signAccessToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_TTL || '15m',
    });
  }

  private signRefreshToken(payload: any) {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_TTL || '7d',
    });
  }

  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  private publicWebUrl(): string {
    return process.env.PUBLIC_WEB_URL || "http://localhost:3000";
  }

  private async sendEmail(to: string, subject: string, text: string, html: string) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = String(process.env.SMTP_SECURE ?? "false") === "true";
    const fromName = process.env.SMTP_FROM_NAME ?? "Auth";
    const fromEmail = process.env.SMTP_FROM_EMAIL ?? "no-reply@example.com";

    if (!host || !user || !pass) {
      this.logger.warn("SMTP not configured. Email not sent.");
      return;
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      text,
      html,
    });
  }

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.userRepository.findOne({
      where: { email: normalizedEmail },
      select: ['id', 'email', 'name', 'password', 'role', 'status', 'avatar', 'isActive'],
    });
    if (!user) return null;

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return null;

    if (user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new UnauthorizedException('الحساب غير نشط أو موقوف');
    }

    const { password: _pw, ...safeUser } = user;
    return safeUser;
  }

  async login(loginDto: LoginDto, request?: Request) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('بيانات تسجيل الدخول غير صحيحة');
    }

    const ip =
      request?.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
      request?.ip ||
      request?.socket?.remoteAddress ||
      null;

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };

    const access_token = this.signAccessToken(payload);
    const refresh_token = this.signRefreshToken({ sub: user.id });

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
      },
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    let decoded: any;
    try {
      decoded = await this.jwtService.verifyAsync(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    const user = await this.userRepository.findOne({
      where: { id: decoded.sub },
      select: ['id', 'email', 'name', 'role', 'status', 'avatar', 'isActive'],
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    if (user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new UnauthorizedException('الحساب غير نشط أو موقوف');
    }

    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const access_token = this.signAccessToken(payload);
    const new_refresh_token = this.signRefreshToken({ sub: user.id });

    return {
      access_token,
      refresh_token: new_refresh_token,
      user,
    };
  }

  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase() }
    });
    if (existingUser) throw new UnauthorizedException('البريد الإلكتروني مستخدم بالفعل');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const rawVerificationToken = this.generateVerificationToken();
    const user = this.userRepository.create({
      ...registerDto,
      email: registerDto.email.toLowerCase(),
      password: hashedPassword,
      emailVerificationToken: this.hashToken(rawVerificationToken),
    });
    const savedUser = await this.userRepository.save(user);
    const verifyUrl = `${this.publicWebUrl()}/auth/verify-email?token=${encodeURIComponent(rawVerificationToken)}`;
    await this.sendEmail(
      savedUser.email,
      "Vérification d'email",
      [
        "Bonjour,",
        "",
        "Merci pour votre inscription.",
        `Confirmez votre email ici : ${verifyUrl}`,
      ].join("\n"),
      `<p>Bonjour,</p><p>Merci pour votre inscription.</p><p><a href="${verifyUrl}">Confirmer mon email</a></p>`
    );
    const { password, ...result } = savedUser;
    return result as User;
  }

  async resendEmailVerification(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() }
    });
    if (!user || user.emailVerifiedAt) return;

    const rawVerificationToken = this.generateVerificationToken();
    await this.userRepository.update(user.id, {
      emailVerificationToken: this.hashToken(rawVerificationToken),
    });

    const verifyUrl = `${this.publicWebUrl()}/auth/verify-email?token=${encodeURIComponent(rawVerificationToken)}`;
    await this.sendEmail(
      user.email,
      "Vérification d'email",
      [
        "Bonjour,",
        "",
        "Voici votre lien de vérification.",
        `Confirmez votre email ici : ${verifyUrl}`,
      ].join("\n"),
      `<p>Bonjour,</p><p>Voici votre lien de vérification.</p><p><a href="${verifyUrl}">Confirmer mon email</a></p>`
    );
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId }, select: ['id', 'password'] });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const ok = await bcrypt.compare(dto.oldPassword, user.password);
    if (!ok) throw new UnauthorizedException('كلمة المرور القديمة غير صحيحة');

    const newHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.update(userId, {
      password: newHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }
  async verifyTokenRaw(token: string, ignoreExpiration = false) {
    if (!token) throw new UnauthorizedException('Token manquant');
    try {
      const secret = process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
      const payload = await this.jwtService.verifyAsync(token, { ignoreExpiration, secret });
      return { valid: true, payload };
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

}
