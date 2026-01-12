import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { AdPlacementsService } from "./ad-placements.service";
import { CreatePlacementDto } from "./dto/create-placement.dto";
import { UpdatePlacementDto } from "./dto/update-placement.dto";

@ApiTags("Ad Placements")
@Controller("ads/placements")
export class AdPlacementsController {
    constructor(private readonly service: AdPlacementsService) { }

    // Public (site)
    @ApiOperation({ summary: "Get active placements (public)" })
    @Get("active")
    findActive() {
        return this.service.findActive();
    }

    // Admin/editor
    @ApiOperation({ summary: "Get all placements (admin/editor)" })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions("ads.placements.view")
    @Get()
    findAll() {
        return this.service.findAll();
    }

    @ApiOperation({ summary: "Create placement" })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions("ads.placements.create")
    @Post()
    create(@Body() dto: CreatePlacementDto) {
        return this.service.create(dto);
    }

    @ApiOperation({ summary: "Update placement" })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions("ads.placements.update")
    @Patch(":id")
    update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdatePlacementDto) {
        return this.service.update(id, dto);
    }

    @ApiOperation({ summary: "Delete placement" })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, PermissionsGuard)
    @RequirePermissions("ads.placements.delete")
    @Delete(":id")
    remove(@Param("id", ParseUUIDPipe) id: string) {
        return this.service.remove(id);
    }
}
