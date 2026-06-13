import { IsString, IsEmail, MinLength, MaxLength, IsNotEmpty, Matches, IsOptional } from 'class-validator';
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

    @ApiProperty({ example: '12.345.678-9', description: 'RUT chileno' })
    @IsString()
    @IsNotEmpty()
    @Matches(/^\d{1,2}\.\d{3}\.\d{3}-[\dKk]$/, { message: 'RUT inválido. Formato esperado: 12.345.678-9' })
    rut!: string;
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

export class CreateVetRequestDto {
    @ApiProperty({ example: 'Clínica Veterinaria San Francisco' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    clinicName!: string;

    @ApiProperty({ example: 'Av. Providencia 1234', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(300)
    address?: string;

    @ApiProperty({ example: '+56 9 1234 5678', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(30)
    phone?: string;

    @ApiProperty({ example: '12.345.678-9', required: false })
    @IsString()
    @IsOptional()
    @MaxLength(12)
    rutClinica?: string;
}

export class VetRequestResponseDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    userId!: string;

    @ApiProperty()
    clinicName!: string;

    @ApiProperty({ required: false })
    address?: string;

    @ApiProperty({ required: false })
    phone?: string;

    @ApiProperty({ required: false })
    rutClinica?: string;

    @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'] })
    status!: string;

    @ApiProperty({ required: false })
    notes?: string;

    @ApiProperty()
    createdAt!: string;
}
