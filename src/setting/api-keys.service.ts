import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiKey } from "../entities/api-key.entity";
import { CreateApiKeyDto, UpdateApiKeyDto } from "./dto/settings.dto";
import * as crypto from "crypto";

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly repo: Repository<ApiKey>
  ) {}

  private generateRawKey(): string {
    // secret brut (à afficher 1 seule fois)
    return crypto.randomBytes(32).toString("hex");
  }

  private hashKey(rawKey: string): string {
    return crypto.createHash("sha256").update(rawKey).digest("hex");
  }

  private prefixFromKey(rawKey: string): string {
    return `ak_${rawKey.slice(0, 10)}`;
  }

  async findAll(): Promise<ApiKey[]> {
    return this.repo.find({ order: { createdAt: "DESC" } });
  }

  async create(dto: CreateApiKeyDto): Promise<{ entity: ApiKey; rawKey: string }> {
    const rawKey = this.generateRawKey();
    const keyHash = this.hashKey(rawKey);
    const prefix = this.prefixFromKey(rawKey);

    const permissions: string[] = Array.isArray(dto.permissions)
      ? dto.permissions.map(String)
      : [];

    const entity = this.repo.create({
      name: dto.name,
      prefix,
      keyHash,
      permissions,
      isActive: true,
      lastUsedAt: null,
    });

    const saved = await this.repo.save(entity); // ✅ ApiKey

    return { entity: saved, rawKey };
  }

  async update(id: string, dto: UpdateApiKeyDto): Promise<ApiKey> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException("API key introuvable");

    if (dto.name !== undefined) existing.name = dto.name;

    if (dto.permissions !== undefined) {
      existing.permissions = Array.isArray(dto.permissions)
        ? dto.permissions.map(String)
        : [];
    }

    if (dto.isActive !== undefined) existing.isActive = dto.isActive;

    return this.repo.save(existing);
  }

  async toggle(id: string): Promise<ApiKey> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException("API key introuvable");
    existing.isActive = !existing.isActive;
    return this.repo.save(existing);
  }

  async remove(id: string): Promise<void> {
    const res = await this.repo.delete(id);
    if (!res.affected) throw new NotFoundException("API key introuvable");
  }
}
