import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ChatService {
    constructor(
        private readonly eventEmitter: EventEmitter2,
        private readonly database: DatabaseService
    ) {}

    async sendMessage(roomId: string, text: string, userId: string) {
        const room = await this.database.room.findFirst({
            where: {
                id: roomId,
                members: { some: { id: userId } }
            }
        });

        if (!room) {
            throw new NotFoundException('اتاقی که می خواهید پیام بفرستید یافت نشد');
        }

        const message = await this.database.message.create({
            data: {
                text,
                roomId,
                userId
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        this.eventEmitter.emit('message.sent', message);

        return message;
    }
}
