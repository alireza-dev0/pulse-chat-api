import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { parseCookie } from 'cookie';
import { Socket } from 'socket.io';

@Injectable()
export class WsAuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const client = context.switchToWs().getClient<Socket>();

        const cookieHeader = client.handshake.headers.cookie;

        if (!cookieHeader) {
            throw new UnauthorizedException('احراز هویت الزامی است');
        }

        const cookies = parseCookie(cookieHeader);

        const token = cookies['access-token'];

        if (!token) {
            throw new UnauthorizedException('توکن دسترسی یافت نشد');
        }

        try {
            const payload: JwtPayload = await this.jwtService.verifyAsync(token);

            client.data.user = payload;

            return true;
        } catch {
            throw new UnauthorizedException('توکن نامعتبر یا منقضی شده است');
        }
    }
}
