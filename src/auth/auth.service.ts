import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class AuthService {
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

  async verifyToken() {
    const token = localStorage.getItem('access_token');
    const res = await fetch('/api/auth/verify-token', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Invalid token');
    return res.json(); // { valid: true, user: {...} }
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

  async generatePasswordResetToken(email: string): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new NotFoundException('البريد الإلكتروني غير موجود');
    }

    const resetToken = this.generateVerificationToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);
    await this.userRepository.update(user.id, {
      passwordResetToken: resetToken,
      passwordResetExpiresAt: expiresAt,
    });

    return resetToken;
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { passwordResetToken: token }
    });

    if (!user || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new UnauthorizedException('رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية');
    }

    await this.userRepository.update(user.id, {
      password: newPassword,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    });
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      throw new UnauthorizedException('رمز التحقق من البريد الإلكتروني غير صالح');
    }

    await this.userRepository.update(user.id, {
      emailVerifiedAt: new Date(),
      emailVerificationToken: null,
    });
  }

  private generateVerificationToken(): string {
    return Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
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

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    // S'assurer que le password est sélectionné
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
      refresh_token, // <- important pour le front
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

  // === NOUVEAU: logique de refresh ===
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

    // Vérifier que l’utilisateur existe et est actif
    const user = await this.userRepository.findOne({
      where: { id: decoded.sub },
      select: ['id', 'email', 'name', 'role', 'status', 'avatar', 'isActive'],
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    if (user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new UnauthorizedException('الحساب غير نشط أو موقوف');
    }

    // Émettre un nouveau couple (rotation optionnelle)
    const payload = { sub: user.id, email: user.email, role: user.role, name: user.name };
    const access_token = this.signAccessToken(payload);
    // Optionnel: rotation
    const new_refresh_token = this.signRefreshToken({ sub: user.id });

    return {
      access_token,
      refresh_token: new_refresh_token, // si tu veux la rotation côté front
      user,
    };
  }

  // … (register, changePassword, resetPassword: n’oublie pas de hasher)
  async register(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email.toLowerCase() }
    });
    if (existingUser) throw new UnauthorizedException('البريد الإلكتروني مستخدم بالفعل');

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      ...registerDto,
      email: registerDto.email.toLowerCase(),
      password: hashedPassword,
      emailVerificationToken: this.generateVerificationToken(),
    });
    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result as User;
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
      const payload = await this.jwtService.verifyAsync(token, { ignoreExpiration });
      return { valid: true, payload };
    } catch {
      throw new UnauthorizedException('Token invalide ou expiré');
    }
  }

}
