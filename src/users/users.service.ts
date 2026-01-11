import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ILike, Repository } from "typeorm";
import { User, UserRole, UserWorkflowStatus } from "../entities/user.entity";
import * as bcrypt from "bcrypt";
import { UpdateNotificationsDto } from "./dto/update-notifications.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { SearchUsersDto } from "./dto/search-users.dto";
import { cutoffFromPeriod } from "src/stats/period";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>
  ) {}

  private isPrivileged(me: any): boolean {
    const role = String(me?.role ?? "").toLowerCase();
    return role === UserRole.ADMIN || role === UserRole.EDITOR_IN_CHIEF;
  }

  /* ======================= STATS ======================= */

  async getStatistics(period?: string) {
    const cutoff = cutoffFromPeriod(period);

    const total = await this.usersRepository.count();
    const active = await this.usersRepository.count({ where: { isActive: true } });

    const newUsersRow = await this.usersRepository
      .createQueryBuilder("u")
      .select("COUNT(*)::int", "c")
      .where('u."createdAt" >= :cutoff', { cutoff })
      .getRawOne<{ c: number }>();

    const byRole = await this.usersRepository
      .createQueryBuilder("u")
      .select("u.role", "role")
      .addSelect("COUNT(*)::int", "count")
      .groupBy("u.role")
      .getRawMany<{ role: string; count: number }>();

    return {
      total,
      active,
      inactive: total - active,
      newUsersInPeriod: Number(newUsersRow?.c ?? 0),
      byRole,
    };
  }

  /* ======================= FIND ======================= */

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      order: { createdAt: "DESC" },
    });
  }

  async findOneOrFail(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async findOne(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  /* ======================= ADMIN CREATE (WITH WORKFLOW) ======================= */

  async createWithWorkflow(userData: Partial<User>, me: any): Promise<User> {
    const privileged = this.isPrivileged(me);

    const user = this.usersRepository.create({
      ...userData,
      email: String(userData.email ?? "").toLowerCase().trim(),
      name: String(userData.name ?? "").trim(),

      createdById: me?.id ?? null,

      workflowStatus: privileged ? UserWorkflowStatus.PUBLISHED : UserWorkflowStatus.IN_REVIEW,
      submittedAt: privileged ? null : new Date(),
      submittedById: privileged ? null : (me?.id ?? null),

      reviewedAt: null,
      reviewedById: null,
      reviewComment: null,
      isRejected: false,
    });

    return this.usersRepository.save(user);
  }

  async create(userData: Partial<User>): Promise<User> {
    // garde ta méthode existante si tu en as besoin ailleurs
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: UpdateUserDto): Promise<User | null> {
    const user = await this.usersRepository.findOneByOrFail({ id });
    Object.assign(user, userData);
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }

  /* ======================= SEARCH ======================= */

  async searchUsers(q: SearchUsersDto) {
    const search = (q.search ?? "").trim();
    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const skip = (page - 1) * limit;

    const where = search
      ? [{ name: ILike(`%${search}%`) }, { email: ILike(`%${search}%`) }, { username: ILike(`%${search}%`) }]
      : [];

    const [items, total] = await this.usersRepository.findAndCount({
      where: where.length ? where : undefined,
      take: limit,
      skip,
      order: { createdAt: "DESC" },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        username: true,
      },
    });

    return { items, total, page, limit };
  }

  /* ======================= ME ======================= */

  async getMe(userId: string) {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  async updateMe(userId: string, dto: any) {
    await this.usersRepository.update(userId, dto);
    return this.getMe(userId);
  }

  async updateNotifications(userId: string, dto: UpdateNotificationsDto) {
    await this.usersRepository.update(userId, { notifications: dto });
    return this.getMe(userId);
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException("Invalid password");

    user.password = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.save(user);

    return { ok: true };
  }

  /* ======================= WORKFLOW ======================= */

  async getReviewQueue(): Promise<User[]> {
    return this.usersRepository.find({
      where: { workflowStatus: UserWorkflowStatus.IN_REVIEW },
      order: { submittedAt: "DESC", createdAt: "DESC" },
    });
  }

  async submit(id: string, meId: string): Promise<User> {
    const user = await this.findOneOrFail(id);

    if (![UserWorkflowStatus.DRAFT, UserWorkflowStatus.REJECTED].includes(user.workflowStatus)) {
      throw new BadRequestException("User cannot be submitted from current status");
    }

    user.workflowStatus = UserWorkflowStatus.IN_REVIEW;
    user.submittedAt = new Date();
    user.submittedById = meId ?? null;

    user.reviewedAt = null;
    user.reviewedById = null;
    user.reviewComment = null;
    user.isRejected = false;

    return this.usersRepository.save(user);
  }

  async approve(id: string, reviewerId: string): Promise<User> {
    const user = await this.findOneOrFail(id);

    if (user.workflowStatus !== UserWorkflowStatus.IN_REVIEW) {
      throw new BadRequestException("User is not in review");
    }

    user.workflowStatus = UserWorkflowStatus.PUBLISHED;
    user.reviewedAt = new Date();
    user.reviewedById = reviewerId ?? null;
    user.reviewComment = null;
    user.isRejected = false;

    return this.usersRepository.save(user);
  }

  async reject(id: string, reviewerId: string, comment?: string): Promise<User> {
    const user = await this.findOneOrFail(id);

    if (user.workflowStatus !== UserWorkflowStatus.IN_REVIEW) {
      throw new BadRequestException("User is not in review");
    }

    user.workflowStatus = UserWorkflowStatus.REJECTED;
    user.reviewedAt = new Date();
    user.reviewedById = reviewerId ?? null;
    user.reviewComment = comment?.trim() ? comment.trim() : null;
    user.isRejected = true;

    return this.usersRepository.save(user);
  }

  async archive(id: string, reviewerId: string): Promise<User> {
    const user = await this.findOneOrFail(id);

    if (user.workflowStatus !== UserWorkflowStatus.PUBLISHED) {
      throw new BadRequestException("Only published users can be archived");
    }

    user.workflowStatus = UserWorkflowStatus.ARCHIVED;
    user.reviewedAt = new Date();
    user.reviewedById = reviewerId ?? null;

    return this.usersRepository.save(user);
  }
}
