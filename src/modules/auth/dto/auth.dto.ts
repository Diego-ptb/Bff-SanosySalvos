import { IsString, IsEmail, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({ example: 'johndoe', description: 'Username', minLength: 3, maxLength: 50 })
    @IsString()
    @MinLength(3)
    @MaxLength(50)
    @IsNotEmpty()
    username!: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    @IsEmail()
    @IsNotEmpty()
    email!: string;

    @ApiProperty({ example: 'securePassword123', description: 'Password', minLength: 6 })
    @IsString()
    @MinLength(6)
    @IsNotEmpty()
    password!: string;
}

export class LoginDto {
    @ApiProperty({ example: 'johndoe', description: 'Username' })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty({ example: 'securePassword123', description: 'Password' })
    @IsString()
    @IsNotEmpty()
    password!: string;
}

export class RefreshDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Refresh token' })
    @IsString()
    @IsNotEmpty()
    refreshToken!: string;
}

export class AuthResponseDto {
    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
    token!: string;

    @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Refresh token' })
    refreshToken!: string;

    @ApiProperty({ example: 'johndoe', description: 'Username' })
    username!: string;

    @ApiProperty({ example: [2, 3], description: 'Array of role IDs', type: [Number] })
    roles!: number[];
}

export class UserInfoDto {
    @ApiProperty({ example: 'johndoe', description: 'Username' })
    username!: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address' })
    email!: string;

    @ApiProperty({ example: [2, 3], description: 'Array of role IDs', type: [Number] })
    roles!: number[];
}
