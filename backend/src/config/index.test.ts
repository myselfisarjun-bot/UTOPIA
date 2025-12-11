import { configSchema } from './schema';

describe('Configuration Schema', () => {
  it('should validate default configuration', () => {
    const { error, value } = configSchema.validate({});

    expect(error).toBeUndefined();
    expect(value).toHaveProperty('NODE_ENV', 'development');
    expect(value).toHaveProperty('PORT', 3000);
    expect(value).toHaveProperty('LOG_LEVEL', 'info');
  });

  it('should validate production environment', () => {
    const { error, value } = configSchema.validate({
      NODE_ENV: 'production',
    });

    expect(error).toBeUndefined();
    expect(value.NODE_ENV).toBe('production');
  });

  it('should reject invalid NODE_ENV', () => {
    const { error } = configSchema.validate({
      NODE_ENV: 'invalid',
    });

    expect(error).toBeDefined();
  });

  it('should validate custom port', () => {
    const { error, value } = configSchema.validate({
      PORT: 8080,
    });

    expect(error).toBeUndefined();
    expect(value.PORT).toBe(8080);
  });

  it('should validate innertube credentials', () => {
    const { error, value } = configSchema.validate({
      INNERTUBE_API_KEY: 'test-api-key',
      INNERTUBE_CLIENT_ID: 'test-client-id',
      INNERTUBE_CLIENT_SECRET: 'test-secret',
    });

    expect(error).toBeUndefined();
    expect(value.INNERTUBE_API_KEY).toBe('test-api-key');
    expect(value.INNERTUBE_CLIENT_ID).toBe('test-client-id');
    expect(value.INNERTUBE_CLIENT_SECRET).toBe('test-secret');
  });

  it('should validate rate limit configuration', () => {
    const { error, value } = configSchema.validate({
      RATE_LIMIT_WINDOW_MS: 60000,
      RATE_LIMIT_MAX_REQUESTS: 50,
    });

    expect(error).toBeUndefined();
    expect(value.RATE_LIMIT_WINDOW_MS).toBe(60000);
    expect(value.RATE_LIMIT_MAX_REQUESTS).toBe(50);
  });

  it('should validate retry configuration', () => {
    const { error, value } = configSchema.validate({
      RETRY_MAX_ATTEMPTS: 5,
      RETRY_DELAY_MS: 2000,
    });

    expect(error).toBeUndefined();
    expect(value.RETRY_MAX_ATTEMPTS).toBe(5);
    expect(value.RETRY_DELAY_MS).toBe(2000);
  });

  it('should validate timeout configuration', () => {
    const { error, value } = configSchema.validate({
      REQUEST_TIMEOUT_MS: 60000,
    });

    expect(error).toBeUndefined();
    expect(value.REQUEST_TIMEOUT_MS).toBe(60000);
  });

  it('should validate log level', () => {
    const validLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'];

    validLevels.forEach((level) => {
      const { error } = configSchema.validate({
        LOG_LEVEL: level,
      });
      expect(error).toBeUndefined();
    });
  });

  it('should reject invalid log level', () => {
    const { error } = configSchema.validate({
      LOG_LEVEL: 'invalid',
    });

    expect(error).toBeDefined();
  });
});
