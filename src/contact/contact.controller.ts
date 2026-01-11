import {
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, Req, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiQuery } from "@nestjs/swagger";
import { Request } from "express";

import { ContactService } from "./contact.service";
import { CreateContactDto } from "./dto/create-contact.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RequirePermissions } from "src/auth/decorators/require-permissions.decorator";
import { PermissionsGuard } from "src/auth/guards/permissions.guard";


@ApiTags("Contact")
@Controller("contact")
export class ContactController {
  constructor(private readonly contactService: ContactService) { }

  @ApiOperation({ summary: "Send contact message" })
  @Post()
  create(@Body() dto: CreateContactDto, @Req() req: Request) {
    const ipAddress = req.ip || (req.connection as any)?.remoteAddress;
    const userAgent = req.get("User-Agent");
    return this.contactService.create({ ...dto, ipAddress, userAgent });
  }

  /* ======================= STATS ======================= */

  @ApiOperation({ summary: "Get unread messages count" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.stats.view")
  @Get("stats/unread-count")
  getUnreadCount() {
    return this.contactService.getUnreadCount();
  }

  @ApiOperation({ summary: "Get contact statistics" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.stats.view")
  @Get("stats/summary")
  getStats() {
    return this.contactService.getStatistics();
  }

  /* ======================= BULK ACTIONS ======================= */

  @ApiOperation({ summary: "Mark all messages as read" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.mark_read")
  @Patch("read-all")
  markAllAsRead() {
    return this.contactService.markAllAsRead();
  }

  @ApiOperation({ summary: "Auto-archive read messages older than X days" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.archive")
  @Post("archive-read")
  @ApiQuery({ name: "days", required: false, description: "Default 30" })
  archiveRead(@Query("days") days?: string) {
    return this.contactService.archiveRead(days ? parseInt(days, 10) : 30);
  }

  /* ======================= LIST ======================= */

  @ApiOperation({ summary: "Get all contact messages (admin)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.view")
  @Get()
  findAll(@Query("page") page?: string, @Query("limit") limit?: string, @Query("unread") unread?: string) {
    return this.contactService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      unreadOnly: unread === "true",
    });
  }

  /* ======================= ITEM ======================= */

  @ApiOperation({ summary: "Get contact message by ID" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.view")
  @Get(":id")
  @ApiParam({ name: "id", description: "Contact message ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.contactService.findOne(id);
  }

  @ApiOperation({ summary: "Mark message as read" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.mark_read")
  @Patch(":id/read")
  markAsRead(@Param("id", ParseUUIDPipe) id: string) {
    return this.contactService.markAsRead(id);
  }

  @ApiOperation({ summary: "Mark message as unread" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.mark_read")
  @Patch(":id/unread")
  markAsUnread(@Param("id", ParseUUIDPipe) id: string) {
    return this.contactService.markAsUnread(id);
  }

  @ApiOperation({ summary: "Archive message" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.archive")
  @Patch(":id/archive")
  archive(@Param("id", ParseUUIDPipe) id: string) {
    return this.contactService.archive(id);
  }

  @ApiOperation({ summary: "Unarchive message" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.archive")
  @Patch(":id/unarchive")
  unarchive(@Param("id", ParseUUIDPipe) id: string) {
    return this.contactService.unarchive(id);
  }

  @ApiOperation({ summary: "Delete contact message" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("contacts.delete")
  @Delete(":id")
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.contactService.delete(id);
  }
}
