import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './errorHandler';
import { AppError, ValidationError, NotFoundError } from '../types/errors';

describe('Error Handler Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      id: 'test-request-id',
      method: 'GET',
      url: '/test',
      ip: '127.0.0.1',
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    nextFunction = jest.fn();
  });

  it('should handle AppError with correct status code', () => {
    const error = new AppError(400, 'Bad Request');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Bad Request',
          statusCode: 400,
          requestId: 'test-request-id',
        }),
      })
    );
  });

  it('should handle ValidationError', () => {
    const error = new ValidationError('Invalid input');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Invalid input',
          statusCode: 400,
        }),
      })
    );
  });

  it('should handle NotFoundError', () => {
    const error = new NotFoundError('Resource not found');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(404);
  });

  it('should handle generic Error as 500', () => {
    const error = new Error('Something went wrong');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          message: 'Internal server error',
          statusCode: 500,
        }),
      })
    );
  });

  it('should include stack trace in development mode', () => {
    process.env.NODE_ENV = 'development';
    const error = new AppError(400, 'Test error');

    errorHandler(error, mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          stack: expect.any(String),
        }),
      })
    );
  });
});
