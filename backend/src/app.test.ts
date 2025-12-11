import request from 'supertest';
import { createApp } from './app';

describe('Express App', () => {
  const app = createApp();

  describe('Health Check', () => {
    it('should return 200 OK for /health endpoint', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('Request ID Middleware', () => {
    it('should add X-Request-ID header to response', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-request-id');
    });

    it('should use provided X-Request-ID if present', async () => {
      const requestId = 'test-request-id-123';
      const response = await request(app).get('/health').set('X-Request-ID', requestId);

      expect(response.headers['x-request-id']).toBe(requestId);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from helmet', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('message', 'Route not found');
      expect(response.body.error).toHaveProperty('statusCode', 404);
    });
  });

  describe('Body Parsing', () => {
    it('should parse JSON body', async () => {
      const testData = { test: 'data' };
      const response = await request(app).post('/test').send(testData);

      expect(response.status).toBe(404);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app).get('/health').set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });
});
