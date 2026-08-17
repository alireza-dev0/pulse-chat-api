import { Module } from '@nestjs/common';
import { RoomGateway } from './room.gateway';
import { RoomService } from './room.service';
import { RoomController } from './room.controller';
import { WsAuthGuard } from 'app/common';

@Module({
    providers: [RoomGateway, RoomService, WsAuthGuard],
    controllers: [RoomController],
    exports: [RoomService],
})
export class RoomModule {}
