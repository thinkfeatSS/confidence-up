import { readEnv, readEnvBool, readEnvInt, readEnvMultiline } from '../common/utils/env.util';

export default () => {
  const mailPort = readEnvInt('MAIL_PORT', 465);
  // Hostinger: 465 = SSL (secure true), 587 = STARTTLS (secure false)
  const mailSecure =
    mailPort === 465 ? true : readEnvBool('MAIL_SECURE', mailPort === 587 ? false : true);

  return {
    port: readEnvInt('PORT', 3000),
    nodeEnv: readEnv('NODE_ENV') ?? 'development',
    appUrl: readEnv('APP_URL') ?? 'http://localhost:3000',
    frontendUrl: readEnv('FRONTEND_URL') ?? 'http://localhost:3001',

    cors: {
      allowedOrigins: readEnv('CORS_ALLOWED_ORIGINS'),
      allowVercelPreviews: readEnv('CORS_ALLOW_VERCEL_PREVIEWS'),
      allowLocalhost: readEnv('CORS_ALLOW_LOCALHOST'),
    },

    database: {
      url: readEnv('DATABASE_URL'),
    },

    jwt: {
      secret: readEnv('JWT_SECRET'),
      expiresIn: readEnv('JWT_EXPIRES_IN') ?? '15m',
      refreshSecret: readEnv('JWT_REFRESH_SECRET'),
      refreshExpiresIn: readEnv('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    },

    google: {
      clientId: readEnv('GOOGLE_CLIENT_ID'),
    },

    mail: {
      host: readEnv('MAIL_HOST') ?? 'smtp.hostinger.com',
      port: mailPort,
      secure: mailSecure,
      user: readEnv('MAIL_USER'),
      password: readEnv('MAIL_PASSWORD'),
      fromName: readEnv('MAIL_FROM_NAME') ?? 'SpeakUpMic',
      fromAddress: readEnv('MAIL_FROM_ADDRESS'),
    },

    firebase: {
      projectId: readEnv('FIREBASE_PROJECT_ID'),
      clientEmail: readEnv('FIREBASE_CLIENT_EMAIL'),
      privateKey: readEnvMultiline('FIREBASE_PRIVATE_KEY'),
    },

    ollama: {
      baseUrl: readEnv('OLLAMA_BASE_URL') ?? 'http://127.0.0.1:11434',
      model: readEnv('OLLAMA_MODEL') ?? 'llama3.2:3b',
    },

    cron: {
      secret: readEnv('CRON_SECRET'),
      internalEnabled:
        readEnv('CRON_INTERNAL_ENABLED') !== undefined
          ? readEnvBool('CRON_INTERNAL_ENABLED', false)
          : (readEnv('NODE_ENV') ?? 'development') !== 'production',
    },
  };
};
