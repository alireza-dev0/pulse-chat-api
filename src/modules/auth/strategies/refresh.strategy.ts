import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'refresh') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: (req: Request) =>
                req.cookies['refresh-token'] ?? null,
            secretOrKey: configService.getOrThrow('JWT_SECRET'),
            passReqToCallback: true,
        });
    }

    validate(req: Request, payload: RefreshTokenPayload): RefreshTokenPayload {
        req.refresh = payload;
        return payload;
    }
}
