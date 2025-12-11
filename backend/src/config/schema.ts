import Joi from 'joi';

export const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  LOG_LEVEL: Joi.string().valid('trace', 'debug', 'info', 'warn', 'error', 'fatal').default('info'),
  INNERTUBE_API_KEY: Joi.string().optional(),
  INNERTUBE_CLIENT_ID: Joi.string().optional(),
  INNERTUBE_CLIENT_SECRET: Joi.string().optional(),
  REQUEST_TIMEOUT_MS: Joi.number().default(30000),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  RETRY_MAX_ATTEMPTS: Joi.number().default(3),
  RETRY_DELAY_MS: Joi.number().default(1000),
  BODY_SIZE_LIMIT: Joi.string().default('10mb'),
  CORS_ORIGIN: Joi.string().default('*'),
  CORS_CREDENTIALS: Joi.boolean().default(false),
})
  .unknown()
  .required();

export interface AppConfig {
  nodeEnv: string;
  port: number;
  logLevel: string;
  innertube: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
  };
  timeout: {
    request: number;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  retry: {
    maxAttempts: number;
    delayMs: number;
  };
  bodyLimit: string;
  cors: {
    origin: string;
    credentials: boolean;
  };
}
