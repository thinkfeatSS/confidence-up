import { NestFactory } from '@nestjs/core';

import { ValidationPipe, Logger } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { json, urlencoded } from 'express';

import { AppModule } from './app.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { buildCorsOptions, createCorsOriginDelegate } from './common/utils/cors.util';



async function bootstrap() {

  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const logger = new Logger('Bootstrap');



  app.use(json({ type: ['application/json', 'text/plain'] }));

  app.use(urlencoded({ extended: true }));



  app.setGlobalPrefix('api/v1');



  const corsOptions = buildCorsOptions();

  app.enableCors({

    origin: createCorsOriginDelegate(corsOptions),

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: ['Content-Type', 'Authorization', 'X-Cron-Secret'],

    credentials: true,

  });



  if (corsOptions.allowedOrigins.length) {

    logger.log(`CORS allowed origins: ${corsOptions.allowedOrigins.join(', ')}`);

  }

  if (corsOptions.allowVercelPreviews) {

    logger.log('CORS: Vercel preview deployments (*.vercel.app) allowed');

  }



  app.useGlobalPipes(

    new ValidationPipe({

      whitelist: true,

      forbidNonWhitelisted: true,

      transform: true,

      transformOptions: { enableImplicitConversion: true },

    }),

  );



  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalInterceptors(new TransformInterceptor());



  const port = process.env.PORT ?? 3000;

  const config = app.get(ConfigService);
  const mailUser = config.get<string>('mail.user');
  const ollamaUrl = config.get<string>('ollama.baseUrl');
  const ollamaModel = config.get<string>('ollama.model');
  logger.log(`Mail SMTP: ${mailUser ? `configured (${mailUser})` : 'NOT CONFIGURED'}`);
  logger.log(`Ollama AI: configured (${ollamaUrl}, model: ${ollamaModel})`);

  await app.listen(port);

  logger.log(`Application running on port ${port}`);

}

bootstrap();


