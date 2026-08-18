import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { corsOptions, getProductionCorsOptions } from './common';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(new ValidationPipe({
        whitelist: true
    }));

    app.use(cookieParser());

    if (process.env.NODE_ENV === 'development') {
        app.enableCors(corsOptions);

        const config = new DocumentBuilder()
            .setTitle('Pulse Chat API')
            .setDescription('Pulse Chat API documentation')
            .setVersion('1.0')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs/swagger', app, document);
    } else {
        app.enableCors(getProductionCorsOptions());
    }

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
