import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthPermissionsService } from '../auth-permissions.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor(configService: ConfigService, private perms: AuthPermissionsService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_ACCESS_SECRET'),
        });
    }

    async validate(payload: any) {
        const userId = payload.sub;
        const permissions = await this.perms.getUserPermissions(userId);

        return {
            userId,
            email: payload.email,
            role: payload.role,
            roles: permissions.roles,
            permissions: permissions.permissions,
        };
    }
}