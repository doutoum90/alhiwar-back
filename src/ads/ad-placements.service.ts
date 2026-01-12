import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreatePlacementDto } from "./dto/create-placement.dto";
import { UpdatePlacementDto } from "./dto/update-placement.dto";
import { AdPlacement, AdProvider } from "src/entities/ad-placement.entity";

@Injectable()
export class AdPlacementsService {
    constructor(@InjectRepository(AdPlacement) private repo: Repository<AdPlacement>) { }

    async findAll(): Promise<AdPlacement[]> {
        return this.repo.find({ order: { createdAt: "DESC" } });
    }

    async findActive(): Promise<AdPlacement[]> {
        return this.repo.find({ where: { enabled: true }, order: { createdAt: "DESC" } });
    }

    async create(dto: CreatePlacementDto): Promise<AdPlacement> {
        // petites gardes supplémentaires
        if (dto.provider === AdProvider.ADSENSE) {
            if (!dto.adsenseClientId || !dto.adsenseSlotId) throw new BadRequestException("AdSense config required");
        }
        if (dto.provider === AdProvider.GAM) {
            if (!dto.gamNetworkCode || !dto.gamAdUnitPath || !dto.gamSizes?.length) throw new BadRequestException("GAM config required");
        }

        const p = this.repo.create({
            key: dto.key.trim(),
            name: dto.name.trim(),
            provider: dto.provider,
            format: dto.format ?? undefined,
            enabled: dto.enabled ?? true,

            adsenseClientId: dto.provider === AdProvider.ADSENSE ? dto.adsenseClientId!.trim() : null,
            adsenseSlotId: dto.provider === AdProvider.ADSENSE ? dto.adsenseSlotId!.trim() : null,
            adsenseFormat: dto.provider === AdProvider.ADSENSE ? (dto.adsenseFormat ?? "auto") : null,
            adsenseResponsive: dto.provider === AdProvider.ADSENSE ? (dto.adsenseResponsive ?? true) : true,

            gamNetworkCode: dto.provider === AdProvider.GAM ? dto.gamNetworkCode!.trim() : null,
            gamAdUnitPath: dto.provider === AdProvider.GAM ? dto.gamAdUnitPath!.trim() : null,
            gamSizes: dto.provider === AdProvider.GAM ? (dto.gamSizes ?? null) : null,
        });

        return this.repo.save(p);
    }

    async update(id: string, dto: UpdatePlacementDto): Promise<AdPlacement> {
        const p = await this.repo.findOne({ where: { id } });
        if (!p) throw new NotFoundException("Placement not found");

        Object.assign(p, {
            key: dto.key !== undefined ? dto.key.trim() : p.key,
            name: dto.name !== undefined ? dto.name.trim() : p.name,
            provider: dto.provider ?? p.provider,
            format: dto.format ?? p.format,
            enabled: dto.enabled ?? p.enabled,
        });

        // reset/validate configs according to provider
        if (p.provider === AdProvider.ADSENSE) {
            p.adsenseClientId = (dto as any).adsenseClientId !== undefined ? ((dto as any).adsenseClientId?.trim() ?? null) : p.adsenseClientId;
            p.adsenseSlotId = (dto as any).adsenseSlotId !== undefined ? ((dto as any).adsenseSlotId?.trim() ?? null) : p.adsenseSlotId;
            p.adsenseFormat = (dto as any).adsenseFormat !== undefined ? ((dto as any).adsenseFormat ?? null) : p.adsenseFormat;
            p.adsenseResponsive = (dto as any).adsenseResponsive !== undefined ? !!(dto as any).adsenseResponsive : p.adsenseResponsive;

            p.gamNetworkCode = null;
            p.gamAdUnitPath = null;
            p.gamSizes = null;

            if (!p.adsenseClientId || !p.adsenseSlotId) throw new BadRequestException("AdSense config required");
        }

        if (p.provider === AdProvider.GAM) {
            p.gamNetworkCode = (dto as any).gamNetworkCode !== undefined ? ((dto as any).gamNetworkCode?.trim() ?? null) : p.gamNetworkCode;
            p.gamAdUnitPath = (dto as any).gamAdUnitPath !== undefined ? ((dto as any).gamAdUnitPath?.trim() ?? null) : p.gamAdUnitPath;
            p.gamSizes = (dto as any).gamSizes !== undefined ? ((dto as any).gamSizes ?? null) : p.gamSizes;

            p.adsenseClientId = null;
            p.adsenseSlotId = null;
            p.adsenseFormat = null;
            p.adsenseResponsive = true;

            if (!p.gamNetworkCode || !p.gamAdUnitPath || !p.gamSizes?.length) throw new BadRequestException("GAM config required");
        }

        if (p.provider === AdProvider.MANUAL) {
            p.adsenseClientId = null;
            p.adsenseSlotId = null;
            p.adsenseFormat = null;
            p.adsenseResponsive = true;

            p.gamNetworkCode = null;
            p.gamAdUnitPath = null;
            p.gamSizes = null;
        }

        return this.repo.save(p);
    }

    async remove(id: string): Promise<void> {
        const p = await this.repo.findOne({ where: { id } });
        if (!p) throw new NotFoundException("Placement not found");
        await this.repo.remove(p);
    }
}
