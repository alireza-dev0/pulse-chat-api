import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseService } from './modules/database/database.service';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { RoomModule } from './modules/room/room.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ChatModule } from './modules/chat/chat.module';


@Module({
    imports: [
        AuthModule,
        DatabaseModule,

        EventEmitterModule.forRoot(),

        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath:
                process.env.NODE_ENV === 'production'
                    ? '.env.production'
                    : '.env.development',
        }),

        CacheModule.registerAsync({
            isGlobal: true,
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                store: createKeyv(configService.get('REDIS_URL')),
            }),
        }),

        RoomModule,
        ChatModule,
    ],
    controllers: [],
    providers: [DatabaseService],
})
export class AppModule {}
