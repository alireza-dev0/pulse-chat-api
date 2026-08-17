declare global {
    interface Request {
        cookies: {
            "access-token"?: string;
            "refresh-token"?: string;
        };

        user?: User;
        refresh?: RefreshTokenPayload;
    }


    interface User extends JwtPayload {}
}

export {}
