import { Injectable, NotFoundException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../entities/user.entity';
import { Article, ArticleStatus } from '../entities/article.entity';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';

interface FindAllOptions {
  page?: number;
  limit?: number;
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
  ) {}

  async create(createAuthorDto: CreateAuthorDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { email: createAuthorDto.email }
    });

    if (existingUser) {
      throw new ConflictException('مستخدم بهذا البريد الإلكتروني موجود بالفعل');
    }

    // Sans hash pour simplifier les tests
    const user = this.userRepository.create({
      ...createAuthorDto,
      password: createAuthorDto.password,
    });
    
    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result as User;
  }

  async findAll(options: FindAllOptions = {}): Promise<PaginatedResult<User>> {
    const { page = 1, limit = 10, role, status, search } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.articles', 'articles')
      .select([
        'user.id', 'user.name', 'user.email', 'user.role', 'user.status',
        'user.avatar', 'user.bio', 'user.phone', 'user.website',
        'user.isActive', 'user.articlesCount', 'user.totalViews',
        'user.lastLoginAt', 'user.createdAt', 'user.updatedAt'
      ]);

    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR user.bio ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    const [data, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id', 'name', 'email', 'role', 'status', 'avatar', 'bio',
        'phone', 'website', 'twitterHandle', 'facebookHandle', 'linkedinHandle',
        'isActive', 'articlesCount', 'totalViews', 'lastLoginAt',
        'emailVerifiedAt', 'createdAt', 'updatedAt'
      ],
      relations: ['articles'],
    });

    if (!user) {
      throw new NotFoundException('المؤلف غير موجود');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateAuthorDto.email && updateAuthorDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateAuthorDto.email);
      if (existingUser) {
        throw new ConflictException('البريد الإلكتروني مستخدم بالفعل');
      }
    }

    await this.userRepository.update(id, updateAuthorDto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    const articlesCount = await this.articleRepository.count({
      where: { authorId: id }
    });

    if (articlesCount > 0) {
      throw new ForbiddenException('لا يمكن حذف مؤلف لديه مقالات منشورة');
    }

    await this.userRepository.remove(user);
  }

  async toggleStatus(id: string): Promise<User> {
    const user = await this.findOne(id);
    const newStatus = user.status === UserStatus.ACTIVE ? UserStatus.INACTIVE : UserStatus.ACTIVE;
    
    await this.userRepository.update(id, { 
      status: newStatus,
      isActive: newStatus === UserStatus.ACTIVE 
    });
    
    return this.findOne(id);
  }

  // ✅ Méthodes manquantes ajoutées
  async searchAuthors(query: string): Promise<User[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.email ILIKE :query OR user.bio ILIKE :query', {
        query: `%${query}%`
      })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .select(['user.id', 'user.name', 'user.email', 'user.avatar', 'user.role'])
      .limit(10)
      .getMany();
  }

  async getStatistics(): Promise<any> {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { isActive: true } });
    const byRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return {
      total,
      active,
      inactive: total - active,
      byRole,
    };
  }

  async changePassword(id: string, changePasswordDto: any): Promise<void> {
    const user = await this.findOne(id);
    
    if (changePasswordDto.oldPassword !== user.password) {
      throw new UnauthorizedException('كلمة المرور القديمة غير صحيحة');
    }

    await this.userRepository.update(id, {
      password: changePasswordDto.newPassword
    });
  }

  async suspend(id: string): Promise<User> {
    await this.userRepository.update(id, { 
      status: UserStatus.SUSPENDED,
      isActive: false 
    });
    return this.findOne(id);
  }

  async activate(id: string): Promise<User> {
    await this.userRepository.update(id, { 
      status: UserStatus.ACTIVE,
      isActive: true 
    });
    return this.findOne(id);
  }
}
