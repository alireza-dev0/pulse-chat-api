import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'access') {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: (req: Request) =>
                req.cookies['access-token'] ?? null,
            secretOrKey: configService.getOrThrow('JWT_SECRET'),
        });
    }

    validate(payload: JwtPayload): JwtPayload {
        return payload;
    }
}
