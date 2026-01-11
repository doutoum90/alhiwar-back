import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { CreateContactDto } from './dto/create-contact.dto';
import { FindAllOptions, PaginatedResult } from '../interfaces'
import { IsNull } from 'typeorm';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private contactRepository: Repository<Contact>,
  ) { }

  async archive(id: string): Promise<Contact> {
    await this.findOne(id);
    await this.contactRepository.update(id, { archivedAt: new Date() });
    return this.findOne(id);
  }

  async unarchive(id: string): Promise<Contact> {
    await this.findOne(id);
    await this.contactRepository.update(id, { archivedAt: null });
    return this.findOne(id);
  }

  async archiveRead(days: number = 30): Promise<{ affected: number }> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const res = await this.contactRepository
      .createQueryBuilder()
      .update(Contact)
      .set({ archivedAt: () => 'NOW()' })
      .where('isRead = true')
      .andWhere('archivedAt IS NULL')
      .andWhere('createdAt < :cutoff', { cutoff })
      .execute();

    return { affected: res.affected || 0 };
  }
  async create(createContactDto: CreateContactDto & { ipAddress?: string; userAgent?: string }): Promise<Contact> {
    const contact = this.contactRepository.create(createContactDto);
    return this.contactRepository.save(contact);
  }

  async findAll(options: FindAllOptions = {}): Promise<PaginatedResult<Contact>> {
    const { page = 1, limit = 10, unreadOnly = false } = options;
    const skip = (page - 1) * limit;

    const queryBuilder = this.contactRepository.createQueryBuilder('contact');

    if (unreadOnly) {
      queryBuilder.where('contact.isRead = :isRead', { isRead: false });
    }

    queryBuilder
      .orderBy('contact.createdAt', 'DESC')
      .skip(skip)
      .take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findUnread(): Promise<Contact[]> {
    return this.contactRepository.find({
      where: { isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async getUnreadCount(): Promise<{ count: number }> {
    const count = await this.contactRepository.count({
      where: { isRead: false },
    });
    return { count };
  }

  async getStatistics(): Promise<any> {
    const total = await this.contactRepository.count();
    const unread = await this.contactRepository.count({ where: { isRead: false } });
    const read = total - unread;

    // Messages par mois (derniers 12 mois)
    const monthlyStats = await this.contactRepository
      .createQueryBuilder('contact')
      .select("DATE_TRUNC('month', contact.createdAt)", 'month')
      .addSelect('COUNT(*)', 'count')
      .where('contact.createdAt >= :date', {
        date: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000)
      })
      .groupBy("DATE_TRUNC('month', contact.createdAt)")
      .orderBy('month', 'DESC')
      .getRawMany();

    // Top domaines email
    const topDomains = await this.contactRepository
      .createQueryBuilder('contact')
      .select("SUBSTRING(contact.email FROM '@(.*)$')", 'domain')
      .addSelect('COUNT(*)', 'count')
      .groupBy('domain')
      .orderBy('count', 'DESC')
      .limit(10)
      .getRawMany();

    return {
      total,
      read,
      unread,
      readPercentage: total > 0 ? (read / total) * 100 : 0,
      monthlyStats,
      topDomains,
    };
  }

  async findOne(id: string): Promise<Contact> {
    const contact = await this.contactRepository.findOne({ where: { id } });
    if (!contact) {
      throw new NotFoundException('الرسالة غير موجودة');
    }
    return contact;
  }

  async markAsRead(id: string): Promise<Contact> {
    await this.findOne(id);
    await this.contactRepository.update(id, { isRead: true });
    return this.findOne(id);
  }

  async markAsUnread(id: string): Promise<Contact> {
    await this.findOne(id);
    await this.contactRepository.update(id, { isRead: false });
    return this.findOne(id);
  }

  async markAllAsRead(): Promise<{ affected: number }> {
    const result = await this.contactRepository.update(
      { isRead: false },
      { isRead: true }
    );
    return { affected: result.affected || 0 };
  }

  async delete(id: string): Promise<void> {
    const contact = await this.findOne(id);
    await this.contactRepository.remove(contact);
  }

  async deleteOld(daysOld: number = 365): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.contactRepository
      .createQueryBuilder()
      .delete()
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return { deleted: result.affected || 0 };
  }
}
