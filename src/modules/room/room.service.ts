import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateRoomDto } from './DTOs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class RoomService {
    constructor(
        private readonly database: DatabaseService,
        private readonly eventEmitter: EventEmitter2,
        @Inject(CACHE_MANAGER) private readonly cache: Cache,
    ) {}

    async createRoom(createRoomDto: CreateRoomDto, userId: string) {
        const room = await this.database.room.create({
            data: {
                name: createRoomDto.name,
                ownerId: userId,
                members: {
                    connect: {
                        id: userId
                    }
                }
            },
        });

        this.eventEmitter.emit('room.created', room);

        return room;
    }


    async joinRoom(roomId: string, userId: string) {
        const room = await this.database.room.findUnique({
            where: {
                id: roomId
            }
        });
        
        if (!room) {
            throw new NotFoundException('اتاقی که می خواهید وارد کنید یافت نشد');
        }

        const isMember = await this.database.room.findFirst({
            where: {
                id: roomId,
                members: { some: { id: userId } }
            }
        });

        if (isMember) {
            return room;
        }

        await this.database.room.update({
            where: {
                id: roomId
            },
            data: {
                members: {
                    connect: {
                        id: userId
                    }
                }
            }
        });

        return room;
    }


    async leaveRoom(roomId: string, userId: string) {
        const room = await this.database.room.findUnique({
            where: {
                id: roomId
            }
        });
        
        if (!room) {
            throw new NotFoundException('اتاقی که می خواهید خارج شوید یافت نشد');
        }

        if (room.ownerId === userId) {
            throw new ConflictException('صاحب اتاق نمی‌تواند اتاق را ترک کند');
        }

        await this.database.room.update({
            where: {
                id: roomId
            },
            data: {
                members: {
                    disconnect: {
                        id: userId
                    }
                }
            }
        });

        return room;
    }


    async getRooms() {
        const rooms = await this.database.room.findMany();

        return rooms;
    }


    async deleteRoom(id: string, userId: string) {
        const room = await this.database.room.findUnique({
            where: {
                id,
                ownerId: userId
            }
        });

        if (!room) {
            throw new NotFoundException('اتاقی که می خواهید حذف کنید یافت نشد');
        }

        await this.database.room.delete({
            where: {
                id
            }
        });

        return room;
    }


    async getRoomMessages(id: string, userId: string) {
        const room = await this.database.room.findFirst({
            where: {
                id,
                members: { some: { id: userId } }
            }
        });

        if (!room) {
            throw new NotFoundException('اتاقی که می خواهید پیام‌های آن را ببینید یافت نشد');
        }

        const messages = await this.database.message.findMany({
            where: {
                roomId: id
            },
            orderBy: {
                createdAt: 'desc'
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

        return messages;
    }


    async getRoomStatuses(roomId: string) {
        const key = `room:${roomId}:statuses`;
        const cached = await this.cache.get<string>(key);

        return cached ? JSON.parse(cached) as Record<string, UserRoomStatus> : {};
    }


    async setUserStatus(
        roomId: string,
        user: Pick<JwtPayload, 'id' | 'name'>,
        status: UserRoomStatus,
        emit = true,
    ) {
        const key = `room:${roomId}:statuses`;
        const cached = await this.cache.get<string>(key);
        const statuses: Record<string, UserRoomStatus> = cached ? JSON.parse(cached) : {};

        if (status === 'offline') {
            delete statuses[user.id];
        } else {
            statuses[user.id] = status;
        }

        await this.cache.set(key, JSON.stringify(statuses));

        if (emit) {
            this.eventEmitter.emit('user.status', { roomId, user, status });
        }

        return statuses;
    }
}