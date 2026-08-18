import type { Room } from '@/src/prisma/generated/client';
import { UseGuards } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { WsAuthGuard, getSocketCorsOptions } from 'app/common';
import { Server, Socket } from 'socket.io';
import { RoomService } from './room.service';


@UseGuards(WsAuthGuard)
@WebSocketGateway({
    cors: getSocketCorsOptions(),
})
export class RoomGateway implements OnGatewayDisconnect {
    constructor(
        private readonly roomService: RoomService
    ) {}

    @WebSocketServer()
    server!: Server;


    @OnEvent('room.created')
    handleRoomCreated(room: Room) {
        this.server.emit('room_created', {
            id: room.id,
            name: room.name,
            ownerId: room.ownerId,
        });
    }


    @OnEvent('room.deleted')
    handleRoomDeleted(payload: { roomId: string, name: string }) {
        const { roomId, name } = payload;
        this.server.emit('room_deleted', {
            id: roomId,
            name: name
        });
    }


    @OnEvent('user.status')
    handleUserStatus(payload: { roomId: string, user: Pick<JwtPayload, 'id' | 'name'>, status: UserRoomStatus }) {
        this.server.to(payload.roomId).emit('user_status', payload);
    }


    handleDisconnect(client: Socket) {
        const user = client.data.user as JwtPayload | undefined;

        if (!user) {
            return;
        }

        for (const roomId of client.rooms) {
            if (roomId === client.id) {
                continue;
            }

            this.roomService.setUserStatus(roomId, user, 'offline');
        }
    }


    @SubscribeMessage('joined_room')
    async handleJoinRoom(
        client: Socket,
        payload: {
            roomId: string;
        }
    ) {
        const { roomId } = payload;
        const user = client.data.user as JwtPayload;

        await this.roomService.joinRoom(roomId, user.id);

        client.join(roomId);

        await this.roomService.setUserStatus(roomId, user, 'online');

        const statuses = await this.roomService.getRoomStatuses(roomId);

        client.emit('room_statuses', { roomId, statuses });

        this.server.to(roomId).except(client.id).emit('joined_room', {
            roomId,
            user: user,
        });
    }


    @SubscribeMessage('left_room')
    async handleLeftRoom(
        client: Socket,
        payload: {
            roomId: string;
        }
    ) {
        const { roomId } = payload;
        const user = client.data.user as JwtPayload;

        client.leave(roomId);

        await this.roomService.setUserStatus(roomId, user, 'offline');

        this.server.to(roomId).except(client.id).emit('left_room', {
            roomId,
            user: user,
        });
    }


    @SubscribeMessage('typing')
    async handleTyping(
        client: Socket,
        payload: {
            roomId: string;
        }
    ) {
        const { roomId } = payload;
        const user = client.data.user as JwtPayload;

        await this.roomService.setUserStatus(roomId, user, 'typing', false);

        this.server.to(roomId).except(client.id).emit('user_status', {
            roomId,
            user,
            status: 'typing',
        });
    }


    @SubscribeMessage('stop_typing')
    async handleStopTyping(
        client: Socket,
        payload: {
            roomId: string;
        }
    ) {
        const { roomId } = payload;
        const user = client.data.user as JwtPayload;

        await this.roomService.setUserStatus(roomId, user, 'online', false);

        this.server.to(roomId).except(client.id).emit('user_status', {
            roomId,
            user,
            status: 'online',
        });
    }
};
