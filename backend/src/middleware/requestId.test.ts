import { Request, Response, NextFunction } from 'express';
import { requestIdMiddleware } from './requestId';

describe('Request ID Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    mockResponse = {
      setHeader: jest.fn(),
    };

    nextFunction = jest.fn();
  });

  it('should generate a request ID when not provided', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.id).toBeDefined();
    expect(typeof mockRequest.id).toBe('string');
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', mockRequest.id);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should use provided request ID from headers', () => {
    const providedId = 'custom-request-id';
    mockRequest.headers = { 'x-request-id': providedId };

    requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockRequest.id).toBe(providedId);
    expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Request-ID', providedId);
  });

  it('should call next middleware', () => {
    requestIdMiddleware(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
  });
});
