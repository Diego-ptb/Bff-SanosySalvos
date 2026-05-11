import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthClient } from '@/http-clients/auth/auth.client';

@Module({
    imports: [HttpModule],
    controllers: [AuthController],
    providers: [AuthService, AuthClient],
    exports: [AuthService, AuthClient],
})
export class AuthModule { }
