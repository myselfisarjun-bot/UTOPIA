import request from 'supertest';
import express from 'express';
import healthRouter from './health';

describe('Health Router', () => {
  const app = express();
  app.use('/health', healthRouter);

  it('should return health check data with status 200', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('environment');
    expect(typeof response.body.timestamp).toBe('string');
    expect(typeof response.body.uptime).toBe('number');
  });

  it('should return valid ISO timestamp', async () => {
    const response = await request(app).get('/health');

    const timestamp = new Date(response.body.timestamp);
    expect(timestamp.toISOString()).toBe(response.body.timestamp);
  });

  it('should return uptime as a positive number', async () => {
    const response = await request(app).get('/health');

    expect(response.body.uptime).toBeGreaterThanOrEqual(0);
  });
});
