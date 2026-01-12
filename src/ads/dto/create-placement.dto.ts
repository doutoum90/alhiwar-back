import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, ValidateIf, IsArray, ArrayMinSize } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { AdProvider, PlacementFormat } from "src/entities/ad-placement.entity";

export class CreatePlacementDto {
    @ApiProperty({ example: "home_sidebar_top" })
    @IsNotEmpty()
    @IsString()
    @MaxLength(120)
    @Matches(/^[a-z0-9_]+$/, { message: "key must be lowercase letters/numbers/_ only" })
    key: string;

    @ApiProperty({ example: "Homepage sidebar top" })
    @IsNotEmpty()
    @IsString()
    @MaxLength(200)
    name: string;

    @ApiProperty({ enum: AdProvider })
    @IsEnum(AdProvider)
    provider: AdProvider;

    @ApiProperty({ enum: PlacementFormat, required: false })
    @IsOptional()
    @IsEnum(PlacementFormat)
    format?: PlacementFormat;

    @ApiProperty({ required: false, default: true })
    @IsOptional()
    @IsBoolean()
    enabled?: boolean;

    // AdSense
    @ValidateIf((o) => o.provider === AdProvider.ADSENSE)
    @IsNotEmpty()
    @IsString()
    adsenseClientId?: string;

    @ValidateIf((o) => o.provider === AdProvider.ADSENSE)
    @IsNotEmpty()
    @IsString()
    adsenseSlotId?: string;

    @IsOptional()
    @IsString()
    adsenseFormat?: string | null;

    @IsOptional()
    @IsBoolean()
    adsenseResponsive?: boolean;

    // GAM
    @ValidateIf((o) => o.provider === AdProvider.GAM)
    @IsNotEmpty()
    @IsString()
    gamNetworkCode?: string;

    @ValidateIf((o) => o.provider === AdProvider.GAM)
    @IsNotEmpty()
    @IsString()
    gamAdUnitPath?: string;

    @ValidateIf((o) => o.provider === AdProvider.GAM)
    @IsArray()
    @ArrayMinSize(1)
    gamSizes?: Array<[number, number]>;
}
