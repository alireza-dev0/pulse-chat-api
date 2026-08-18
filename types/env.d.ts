
namespace NodeJS {
    interface ProcessEnv {
        NODE_ENV: 'development' | 'production' | 'test';
        PORT: string;
        DATABASE_URL: string;
        REDIS_URL: string;
        JWT_SECRET: string;
        BCRYPT_SALT_ROUNDS: string;
        CLIENT_URL: string;
    }
}