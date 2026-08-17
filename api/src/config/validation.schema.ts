import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  APP_URL: Joi.string().default('http://localhost:3000'),
  FRONTEND_URL: Joi.string().default('http://localhost:3001'),
  CORS_ALLOWED_ORIGINS: Joi.string().optional(),
  CORS_ALLOW_VERCEL_PREVIEWS: Joi.string().valid('true', 'false').optional(),
  CORS_ALLOW_LOCALHOST: Joi.string().valid('true', 'false').optional(),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  GOOGLE_CLIENT_ID: Joi.string().optional(),

  MAIL_HOST: Joi.string().required(),
  MAIL_PORT: Joi.number().default(465),
  MAIL_SECURE: Joi.string().default('true'),
  MAIL_USER: Joi.string().email().required(),
  MAIL_PASSWORD: Joi.string().required(),
  MAIL_FROM_NAME: Joi.string().default('ConfidenceUp'),
  MAIL_FROM_ADDRESS: Joi.string().email().required(),

  FIREBASE_PROJECT_ID: Joi.string().optional(),
  FIREBASE_CLIENT_EMAIL: Joi.string().optional(),
  FIREBASE_PRIVATE_KEY: Joi.string().optional(),

  GEMINI_API_KEY: Joi.string().optional(),
  GEMINI_MODEL: Joi.string().default('gemini-2.0-flash'),

  CRON_SECRET: Joi.when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(16).required(),
    otherwise: Joi.string().optional(),
  }),
  CRON_INTERNAL_ENABLED: Joi.string().valid('true', 'false').optional(),
});
