import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CreateRoomDto {

    @ApiProperty({
        description: 'The name of the room',
        example: 'Room 1',
    })
    @IsString()
    @IsNotEmpty()
    name!: string;
}