import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable CORS for frontend requests
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('AI Unit Test Agent API')
    .setDescription('API documentation for C# automated unit test generation and optimization')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3005);
  console.log('NestJS Backend running on http://localhost:3005');
}
bootstrap();
