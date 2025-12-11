import dotenv from 'dotenv';
import { configSchema, AppConfig } from './schema';

dotenv.config();

const validateConfig = (): AppConfig => {
  const { error, value } = configSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    throw new Error(`Configuration validation error: ${errorMessage}`);
  }

  const config: AppConfig = {
    nodeEnv: value.NODE_ENV as string,
    port: value.PORT as number,
    logLevel: value.LOG_LEVEL as string,
    innertube: {
      apiKey: value.INNERTUBE_API_KEY as string | undefined,
      clientId: value.INNERTUBE_CLIENT_ID as string | undefined,
      clientSecret: value.INNERTUBE_CLIENT_SECRET as string | undefined,
    },
    timeout: {
      request: value.REQUEST_TIMEOUT_MS as number,
    },
    rateLimit: {
      windowMs: value.RATE_LIMIT_WINDOW_MS as number,
      maxRequests: value.RATE_LIMIT_MAX_REQUESTS as number,
    },
    retry: {
      maxAttempts: value.RETRY_MAX_ATTEMPTS as number,
      delayMs: value.RETRY_DELAY_MS as number,
    },
    bodyLimit: value.BODY_SIZE_LIMIT as string,
    cors: {
      origin: value.CORS_ORIGIN as string,
      credentials: value.CORS_CREDENTIALS as boolean,
    },
  };

  return config;
};

export const config = validateConfig();
