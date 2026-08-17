import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { WsAuthGuard } from 'app/common';
import { RoomModule } from '../room/room.module';

@Module({
    imports: [RoomModule],
    providers: [ChatService, ChatGateway, WsAuthGuard],
    controllers: [ChatController],
})
export class ChatModule {}
