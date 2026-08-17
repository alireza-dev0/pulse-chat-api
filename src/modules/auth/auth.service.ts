import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';

import { SignupDto } from './DTOs/signup.dto';
import { SigninDto } from './DTOs/signin.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly configService: ConfigService,
        private readonly jwtService: JwtService,
    ) {}


    async signup(dto: SignupDto) {
        const { email, name, password } = dto;
        
        const existingUser = await this.databaseService.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new ConflictException('کاربری با این ایمیل قبلاً وجود دارد');
        }

        const hashedPassword = await bcrypt.hash(password, Number(this.configService.get('BCRYPT_SALT_ROUNDS')));

        const user = await this.databaseService.user.create({
            data: { email, name, password: hashedPassword },
        });

        
        const accessPayload: JwtPayload = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
        };

        const refreshPayload: RefreshTokenPayload = {
            id: user.id.toString(),
        };

        const accessToken = await this.jwtService.signAsync(accessPayload, {
            expiresIn: "15m",
        });

        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            expiresIn: "7d",
        });

        return { accessToken, refreshToken };
    }

    async signin(dto: SigninDto) {
        const { email, password } = dto;
        
        const user = await this.databaseService.user.findUnique({
            where: { email },
        });

        if (!user) {
            throw new UnauthorizedException('کاربری با این ایمیل یافت نشد');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            throw new UnauthorizedException('رمز عبور صحیح نیست');
        }

        const accessPayload: JwtPayload = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
        };
        
        const refreshPayload: RefreshTokenPayload = {
            id: user.id.toString(),
        };

        const accessToken = await this.jwtService.signAsync(accessPayload, {
            expiresIn: "15m",
        });
        
        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            expiresIn: "7d",
        });

        return { accessToken, refreshToken };
    }


    async refreshToken(id: string) {
        const user = await this.databaseService.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new UnauthorizedException('کاربری با این id یافت نشد');
        }

        const accessPayload: JwtPayload = {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
        };

        const refreshPayload: RefreshTokenPayload = {
            id: user.id.toString(),
        };

        const accessToken = await this.jwtService.signAsync(accessPayload, {
            expiresIn: "15m",
        });

        const refreshToken = await this.jwtService.signAsync(refreshPayload, {
            expiresIn: "7d",
        });

        return { accessToken, refreshToken };
    }
}
