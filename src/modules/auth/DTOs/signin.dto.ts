import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SigninDto {
    @ApiProperty({ example: 'user@example.com' })
    @IsEmail({}, { message: 'ایمیل معتبر نیست' })
    @IsNotEmpty({ message: 'ایمیل الزامی است' })
    email!: string;

    @ApiProperty({ example: 'password123' })
    @IsString({ message: 'رمز عبور باید متن باشد' })
    @IsNotEmpty({ message: 'رمز عبور الزامی است' })
    password!: string;
}
