import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from '../entities/user.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { RolesGuard } from './guards/roles.guard';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RbacModule } from './rbac.module';
import { AuthPermissionsService } from './auth-permissions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    RbacModule,
    ConfigModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get("JWT_ACCESS_SECRET") || config.get("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>('JWT_ACCESS_TTL') || config.get<string>('JWT_EXPIRES_IN') || '15m',
        },
      }),
    })
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy, RolesGuard, AuthPermissionsService],
  controllers: [AuthController],
  exports: [AuthService, JwtStrategy, PassportModule, RolesGuard],
})
export class AuthModule { }
