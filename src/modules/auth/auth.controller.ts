import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response as ExpressResponse } from 'express';
import { SignupDto } from './DTOs/signup.dto';
import { SigninDto } from './DTOs/signin.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@/src/common';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @ApiOkResponse({
        description: 'ُSignup Success Response',
        example: {
            message: 'کاربر با موفقیت ثبت نام کرد',
        }
    })
    @Post("signup")
    async signup(@Body() dto: SignupDto, @Res() res: ExpressResponse) {
        const tokens = await this.authService.signup(dto);
        
        const response = this.setCookies(res, tokens);

        return response.json({
            message: 'کاربر با موفقیت ثبت نام کرد'
        }).status(200);
    }


    @ApiOkResponse({
        description: 'ُSignin Success Response',
        example: {
            message: 'کاربر با موفقیت وارد شد',
        }
    })
    @Post("signin")
    async signin(@Body() dto: SigninDto, @Res() res: ExpressResponse) {
        const tokens = await this.authService.signin(dto);
        
        const response = this.setCookies(res, tokens);
        
        return response.json({
            message: 'کاربر با موفقیت وارد شد'
        }).status(200);
    }


    @ApiOkResponse({
        description: 'ُRefresh Token Success Response',
        example: {
            message: 'توکن تازه سازی با موفقیت ایجاد شد',
        }
    })
    @UseGuards(AuthGuard("refresh"))
    @Post("refresh-token")
    async refreshToken(@Res() res: ExpressResponse, @Req() req: Request) {
        const { accessToken, refreshToken } = await this.authService.refreshToken(req.refresh!.id);
        
        const response = this.setCookies(res, { accessToken, refreshToken });
        
        return response.json({
            message: 'توکن تازه سازی با موفقیت ایجاد شد'
        }).status(200);
    }


    @ApiOkResponse({
        description: 'Get Current User Response',
        example: {
            id: '1',
            email: 'user@example.com',
            name: 'علی',
        }
    })
    @UseGuards(AuthGuard('access'))
    @Get('me')
    me(@User() user: User) {
        return user;
    }


    @ApiOkResponse({
        description: 'Logout Success Response',
        example: {
            message: 'با موفقیت خارج شدید',
        }
    })
    @Post('logout')
    logout(@Res() res: ExpressResponse) {
        const response = this.clearCookies(res);

        return response.json({
            message: 'با موفقیت خارج شدید',
        }).status(200);
    }


    private setCookies(res: ExpressResponse, tokens: { accessToken?: string, refreshToken?: string }): ExpressResponse {
        const { accessToken, refreshToken } = tokens;

        accessToken && res.cookie('access-token', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000, // 5 minutes
            sameSite: 'lax',
        });

        refreshToken && res.cookie('refresh-token', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'lax',
        });

        return res;
    }


    private clearCookies(res: ExpressResponse): ExpressResponse {
        res.clearCookie('access-token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        res.clearCookie('refresh-token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return res;
    }
}
