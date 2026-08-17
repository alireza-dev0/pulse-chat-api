import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from 'app/prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class DatabaseService extends PrismaClient {
    constructor(private readonly configService: ConfigService) {
        const adapter = new PrismaPg({
            connectionString: configService.get('DATABASE_URL'),
        });

        super({
            adapter,
        });
    }
}
