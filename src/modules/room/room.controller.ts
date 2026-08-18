import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RoomService } from './room.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateRoomDto } from './DTOs';
import { User } from '@/src/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';

@UseGuards(AuthGuard("access"))
@Controller('room')
export class RoomController {

    constructor(
        private readonly roomService: RoomService,
        private readonly eventEmitter: EventEmitter2
    ) {}


    @ApiOkResponse({
        description: 'Get Rooms Success Response',
        example: {
            rooms: [
                { id: '1', name: 'Room 1' },
            ]
        }
    })
    @Get()
    async handleGetRooms() {
        const result = await this.roomService.getRooms();

        return result.map((room) => ({
            id: room.id,
            name: room.name,
            ownerId: room.ownerId,
        }));
    }


    @ApiCreatedResponse({
        description: 'Create Room Success Response',
        example: {
            id: '1',
            name: 'Room 1'
        }
    })
    @Post()
    async handleCreateRoom(
        @Body() createRoomDto: CreateRoomDto,
        @User() user: User
    ) {
        const result = await this.roomService.createRoom(createRoomDto, user.id);

        return {
            id: result.id,
            name: result.name,
            ownerId: result.ownerId,
        }
    }


    @ApiOkResponse({
        description: 'Delete Room Success Response',
        example: {
            id: '1',
            name: 'Room 1'
        }
    })
    @ApiConflictResponse({
        description: 'Room Not Found Response',
        example: {
            message: 'اتاقی که می خواهید حذف کنید یافت نشد'
        }
    })
    @Delete(':id')
    async handleDeleteRoom(
        @Param('id') id: string,
        @User() user: User
    ) {
        const result = await this.roomService.deleteRoom(id, user.id);

        this.eventEmitter.emit('room.deleted', {
            roomId: result.id,
            name: result.name
        });

        return {
            id: result.id,
            name: result.name
        };
    }


    @ApiOkResponse({
        description: 'Get Room Messages Success Response',
        example: {
            messages: [
                { id: '1', text: 'Message 1', user: { id: '1', name: 'User 1' }, createdAt: '2021-01-01T00:00:00.000Z' }
            ]
        }
    })
    @Get(":id/messages")
    async handleGetRoomMessages(
        @Param('id') id: string,
        @User() user: User
    ) {
        const result = await this.roomService.getRoomMessages(id, user.id);

        return result.map((message) => ({
            id: message.id,
            text: message.text,
            user: message.user,
            createdAt: message.createdAt
        }));
    }
}
