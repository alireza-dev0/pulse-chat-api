import type { CookieOptions } from 'express';

export function getAuthCookieOptions(): CookieOptions {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
    };
}
