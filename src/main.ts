import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters';
import { CorrelationIdInterceptor, LoggingInterceptor } from './common/interceptors';

async function bootstrap(): Promise<void> {
    const app = await NestFactory.create(AppModule);

    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT') || 3000;
    const corsOrigins = configService.get<string[]>('CORS_ORIGINS') || ['http://localhost:3001'];
    const nodeEnv = configService.get<string>('NODE_ENV') || 'development';

    // Seguridad
    app.use(helmet());

    // CORS
    app.enableCors({
        origin: corsOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    });

    // Prefijo global
    app.setGlobalPrefix('');

    // Validación global
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            stopAtFirstError: false,
            exceptionFactory: (errors) => {
                const formattedErrors = errors.reduce((acc, error) => {
                    if (error.constraints) {
                        acc[error.property] = Object.values(error.constraints);
                    }
                    return acc;
                }, {} as Record<string, string[]>);

                return new BadRequestException({
                    message: 'Validation failed',
                    errors: formattedErrors,
                });
            },
        })
    );

    // Interceptores globales
    app.useGlobalInterceptors(
        new CorrelationIdInterceptor(),
        new LoggingInterceptor()
    );

    // Filtro de excepciones global
    app.useGlobalFilters(new AllExceptionsFilter());

    // Swagger/OpenAPI
    if (nodeEnv !== 'production') {
        const config = new DocumentBuilder()
            .setTitle('Sanos y Salvos BFF API')
            .setDescription('Backend for Frontend (BFF) para Sanos y Salvos')
            .setVersion('1.0')
            .addBearerAuth()
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document);
    }

    // Graceful shutdown
    app.enableShutdownHooks();

    await app.listen(port);
    Logger.log(`BFF listening on port ${port} (${nodeEnv})`);
}

bootstrap().catch((error) => {
    Logger.error('Failed to bootstrap application', error);
    process.exit(1);
});
