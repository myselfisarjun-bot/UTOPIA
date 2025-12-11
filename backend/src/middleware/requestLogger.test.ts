import { Request, Response, NextFunction } from 'express';
import { requestLoggerMiddleware } from './requestLogger';

describe('Request Logger Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      id: 'test-request-id',
      method: 'GET',
      url: '/test',
      headers: {
        'user-agent': 'test-agent',
      } as Record<string, string | string[]>,
    };

    mockResponse = {
      on: jest.fn(),
      statusCode: 200,
    };

    nextFunction = jest.fn();
  });

  it('should set startTime on request', () => {
    requestLoggerMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.startTime).toBeDefined();
    expect(typeof mockRequest.startTime).toBe('number');
  });

  it('should call next middleware', () => {
    requestLoggerMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });

  it('should attach finish event listener', () => {
    requestLoggerMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });

  it('should attach close event listener', () => {
    requestLoggerMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.on).toHaveBeenCalledWith('close', expect.any(Function));
  });
});
