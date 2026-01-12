// entities/ad-placement.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm";

export enum AdProvider {
    MANUAL = "manual",
    ADSENSE = "adsense",
    GAM = "gam",
}

export enum PlacementFormat {
    BANNER = "banner",
    SIDEBAR = "sidebar",
    POPUP = "popup",
    INLINE = "inline",
}

@Entity("ad_placements")
export class AdPlacement {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Index({ unique: true })
    @Column({ length: 120 })
    key: string; // ex: "home_sidebar_top"

    @Column({ length: 200 })
    name: string; // ex: "Homepage sidebar top"

    @Column({ type: "enum", enum: AdProvider })
    provider: AdProvider;

    @Column({ type: "enum", enum: PlacementFormat, default: PlacementFormat.BANNER })
    format: PlacementFormat;

    @Column({ default: true })
    enabled: boolean;

    // --- AdSense config
    @Column({ type: "varchar", length: 64, nullable: true })
    adsenseClientId: string | null; // ex: "ca-pub-xxxxxxxx"

    @Column({ type: "varchar", length: 64, nullable: true })
    adsenseSlotId: string | null; // ex: "1234567890"

    @Column({ type: "varchar", length: 40, nullable: true })
    adsenseFormat: string | null; // ex: "auto"

    @Column({ default: true })
    adsenseResponsive: boolean;

    // --- GAM config
    @Column({ type: "varchar", length: 32, nullable: true })
    gamNetworkCode: string | null; // ex: "1234567"

    @Column({ type: "varchar", length: 200, nullable: true })
    gamAdUnitPath: string | null; // ex: "/1234567/home_sidebar_top"

    @Column({ type: "simple-json", nullable: true })
    gamSizes: Array<[number, number]> | null; // ex: [[300,250],[300,600]]

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    
    updatedAt: Date;
}
