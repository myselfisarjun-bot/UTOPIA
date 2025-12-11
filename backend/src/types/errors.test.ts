import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  TooManyRequestsError,
  InternalServerError,
} from './errors';

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError(400, 'Test error');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Test error');
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    it('should create a non-operational error', () => {
      const error = new AppError(500, 'Test error', false);

      expect(error.isOperational).toBe(false);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with status 400', () => {
      const error = new ValidationError('Invalid input');

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('Invalid input');
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with status 404', () => {
      const error = new NotFoundError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
    });

    it('should accept custom message', () => {
      const error = new NotFoundError('User not found');

      expect(error.message).toBe('User not found');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create an UnauthorizedError with status 401', () => {
      const error = new UnauthorizedError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Invalid token');

      expect(error.message).toBe('Invalid token');
    });
  });

  describe('ForbiddenError', () => {
    it('should create a ForbiddenError with status 403', () => {
      const error = new ForbiddenError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe('Forbidden');
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Insufficient permissions');

      expect(error.message).toBe('Insufficient permissions');
    });
  });

  describe('TooManyRequestsError', () => {
    it('should create a TooManyRequestsError with status 429', () => {
      const error = new TooManyRequestsError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(429);
      expect(error.message).toBe('Too many requests');
    });

    it('should accept custom message', () => {
      const error = new TooManyRequestsError('Rate limit exceeded');

      expect(error.message).toBe('Rate limit exceeded');
    });
  });

  describe('InternalServerError', () => {
    it('should create an InternalServerError with status 500', () => {
      const error = new InternalServerError();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe('Internal server error');
    });

    it('should accept custom message', () => {
      const error = new InternalServerError('Database connection failed');

      expect(error.message).toBe('Database connection failed');
    });
  });
});
