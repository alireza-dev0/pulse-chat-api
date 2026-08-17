import { UseGuards } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { WsAuthGuard } from 'app/common';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { OnEvent } from '@nestjs/event-emitter';
import { RoomService } from '../room/room.service';

@UseGuards(WsAuthGuard)
@WebSocketGateway({
    cors: {
        origin: 'http://localhost:3000',
        credentials: true
    }
})
export class ChatGateway {
    constructor(
        private readonly chatService: ChatService,
        private readonly roomService: RoomService,
    ) {}

    @WebSocketServer()
    server!: Server;


    @OnEvent('message.sent')
    handleMessageSent(message: { id: string, text: string, roomId: string, createdAt: Date, user: { id: string, name: string } }) {
        this.server.to(message.roomId).emit('message', {
            id: message.id,
            text: message.text,
            user: message.user,
            createdAt: message.createdAt
        });
    }


    @SubscribeMessage('send_message')
    async handleMessage(
        client: Socket,
        payload: {
            roomId: string;
            message: string;
        }
    ) {
        const user: JwtPayload = client.data.user;

        await this.chatService.sendMessage(payload.roomId, payload.message, user.id);

        await this.roomService.setUserStatus(payload.roomId, user, 'online', false);

        this.server.to(payload.roomId).except(client.id).emit('user_status', {
            roomId: payload.roomId,
            user,
            status: 'online',
        });
    }
}
