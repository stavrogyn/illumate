// Initialize telemetry FIRST before any other imports
import './telemetry'

import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { getLogger } from '@psy/observability/node'

async function bootstrap() {
  const logger = getLogger()
  
  const app = await NestFactory.create(AppModule, {
    // Use our observability logger as the NestJS logger
    bufferLogs: true,
  })

  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('PSY API')
    .setDescription('Therapy Management System API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication endpoints')
    .addTag('clients', 'Client management')
    .addTag('sessions', 'Session management')
    .addTag('ai', 'AI Analysis')
    .addTag('metrics', 'Observability endpoints')
    .build()

  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  const port = process.env.PORT || 4000
  await app.listen(port)

  logger.info(`🚀 API is running`, { port, url: `http://localhost:${port}` })
  logger.info(`📚 Swagger docs available`, { url: `http://localhost:${port}/docs` })
  logger.info(`📊 Metrics endpoint available`, { url: `http://localhost:${port}/metrics` })
}

bootstrap()
