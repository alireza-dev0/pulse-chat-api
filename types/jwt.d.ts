declare global {
    type UserRoomStatus = 'online' | 'offline' | 'typing';

    interface JwtPayload {
        id: string,
        email: string,
        name: string
    }

    interface RefreshTokenPayload {
        id: string;
    }
}

export {}