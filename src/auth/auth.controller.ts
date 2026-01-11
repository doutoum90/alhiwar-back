import {
  Controller, Post, Body, Get, UseGuards, Request, Patch, HttpCode, HttpStatus, Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";

import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { User, UserRole } from "../entities/user.entity";
import { RequirePermissions } from "./decorators/require-permissions.decorator";
import { PermissionsGuard } from "./guards/permissions.guard";

export type AuthUser = {
  userId: string;
  email: string;
  role?: UserRole;
  roles?: string[];
  permissions?: string[];
};

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) { }

  @ApiOperation({ summary: "Auth statistics (registrations, logins)" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("auth.stats.view")
  @Get("stats/summary")
  @ApiQuery({ name: "period", required: false, enum: ["7", "30", "90", "365"] })
  authStats(@Query("period") period?: string) {
    return this.authService.getAuthStats(period);
  }

  @ApiOperation({ summary: "User login" })
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Request() req: any) {
    return this.authService.login(loginDto, req);
  }

  @ApiOperation({ summary: "User registration" })
  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @ApiOperation({ summary: "Get current user profile" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  getProfile(@CurrentUser() user: AuthUser) {
    return user;
  }

  @ApiOperation({ summary: "Update user profile" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch("profile")
  updateProfile(@CurrentUser() user: User, @Body() updateData: Partial<User>) {
    return this.authService.updateProfile(user.id, updateData);
  }

  @ApiOperation({ summary: "Change password" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  async changePassword(@CurrentUser() user: User, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(user.id, dto);
    return { message: "Password changed successfully" };
  }

  @ApiOperation({ summary: "Request password reset" })
  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.generatePasswordResetToken(dto.email);
    return { message: "If the email exists, a reset link has been sent" };
  }

  @ApiOperation({ summary: "Reset password with token" })
  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: "Password reset successfully" };
  }

  @ApiOperation({ summary: "Verify email address" })
  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body("token") token: string) {
    await this.authService.verifyEmail(token);
    return { message: "Email verified successfully" };
  }

  @ApiOperation({ summary: "Resend email verification" })
  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body() dto: ResendVerificationDto) {
    await this.authService.resendEmailVerification(dto.email);
    return { message: "If the email exists, a verification email has been sent" };
  }

  @ApiOperation({ summary: "Logout user" })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: "Logged out successfully" };
  }

  @Post("verify")
  async verifyTokenRaw(@Body("token") token: string, @Body("ignoreExpiration") ignoreExpiration = false) {
    return this.authService.verifyTokenRaw(token, ignoreExpiration);
  }

  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Body("refresh_token") refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }
}
