import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';
import { App } from 'supertest/types';

import { RequestHelper, RequestOptions } from './request.helper';

jest.mock('supertest');

describe('RequestHelper', () => {
  let requestHelper: RequestHelper;
  let mockApp: INestApplication<App>;
  let mockHttpServer: {
    get: jest.Mock;
    post: jest.Mock;
    patch: jest.Mock;
    delete: jest.Mock;
    put: jest.Mock;
  };
  let mockRequest: {
    set: jest.Mock;
    query: jest.Mock;
    send: jest.Mock;
  };

  beforeEach(() => {
    mockRequest = {
      set: jest.fn().mockReturnThis(),
      query: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };

    mockHttpServer = {
      get: jest.fn().mockReturnValue(mockRequest),
      post: jest.fn().mockReturnValue(mockRequest),
      patch: jest.fn().mockReturnValue(mockRequest),
      delete: jest.fn().mockReturnValue(mockRequest),
      put: jest.fn().mockReturnValue(mockRequest),
    };

    mockApp = {
      getHttpServer: jest.fn().mockReturnValue(mockHttpServer),
    } as unknown as INestApplication<App>;

    (request as jest.Mock).mockReturnValue(mockHttpServer);

    requestHelper = new RequestHelper(mockApp);
  });

  describe('makeRequest', () => {
    it('should make GET request without options', async () => {
      await requestHelper.makeRequest('get', '/test');

      expect(mockHttpServer.get).toHaveBeenCalledWith('/test');
      expect(mockRequest.set).not.toHaveBeenCalled();
      expect(mockRequest.query).not.toHaveBeenCalled();
      expect(mockRequest.send).not.toHaveBeenCalled();
    });

    it('should make POST request with body', async () => {
      const options: RequestOptions = {
        body: { name: 'test', value: 123 },
      };

      await requestHelper.makeRequest('post', '/test', options);

      expect(mockHttpServer.post).toHaveBeenCalledWith('/test');
      expect(mockRequest.send).toHaveBeenCalledWith(options.body);
    });

    it('should make PATCH request with headers', async () => {
      const options: RequestOptions = {
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
      };

      await requestHelper.makeRequest('patch', '/test', options);

      expect(mockHttpServer.patch).toHaveBeenCalledWith('/test');
      expect(mockRequest.set).toHaveBeenCalledWith(
        'Authorization',
        'Bearer token',
      );
      expect(mockRequest.set).toHaveBeenCalledWith(
        'Content-Type',
        'application/json',
      );
    });

    it('should make DELETE request with query parameters', async () => {
      const options: RequestOptions = {
        query: {
          page: '1',
          limit: '10',
        },
      };

      await requestHelper.makeRequest('delete', '/test', options);

      expect(mockHttpServer.delete).toHaveBeenCalledWith('/test');
      expect(mockRequest.query).toHaveBeenCalledWith(options.query);
    });

    it('should make PUT request with all options', async () => {
      const options: RequestOptions = {
        headers: { Authorization: 'Bearer token' },
        query: { id: '123' },
        body: { name: 'test' },
      };

      await requestHelper.makeRequest('put', '/test', options);

      expect(mockHttpServer.put).toHaveBeenCalledWith('/test');
      expect(mockRequest.set).toHaveBeenCalled();
      expect(mockRequest.query).toHaveBeenCalled();
      expect(mockRequest.send).toHaveBeenCalled();
    });
  });

  describe('expectErrorResponse', () => {
    it('should check status code', () => {
      const response = {
        status: 400,
        body: {
          statusCode: 400,
          message: 'Bad Request',
        },
      } as Response;

      expect(() => {
        requestHelper.expectErrorResponse(response, 400);
      }).not.toThrow();
    });

    it('should check status code and message when provided', () => {
      const response = {
        status: 404,
        body: {
          statusCode: 404,
          message: 'Not found',
        },
      } as Response;

      expect(() => {
        requestHelper.expectErrorResponse(response, 404, 'Not found');
      }).not.toThrow();
    });

    it('should check array message', () => {
      const response = {
        status: 400,
        body: {
          statusCode: 400,
          message: ['Field 1 is required', 'Field 2 is invalid'],
        },
      } as Response;

      expect(() => {
        requestHelper.expectErrorResponse(response, 400, 'Field 1');
      }).not.toThrow();
    });

    it('should throw when status does not match', () => {
      const response = {
        status: 200,
        body: {
          statusCode: 200,
        },
      } as Response;

      expect(() => {
        requestHelper.expectErrorResponse(response, 400);
      }).toThrow();
    });
  });

  describe('expectSuccessResponse', () => {
    it('should check status code', () => {
      const response = {
        status: 200,
        body: { data: 'test' },
      } as Response;

      expect(() => {
        requestHelper.expectSuccessResponse(response, 200);
      }).not.toThrow();
    });

    it('should check schema properties when provided', () => {
      const response = {
        status: 200,
        body: {
          id: '123',
          name: 'test',
          value: 100,
        },
      } as Response;

      const schema = {
        id: expect.any(String),
        name: expect.any(String),
        value: expect.any(Number),
      };

      expect(() => {
        requestHelper.expectSuccessResponse(response, 200, schema);
      }).not.toThrow();
    });

    it('should throw when status does not match', () => {
      const response = {
        status: 500,
        body: {},
      } as Response;

      expect(() => {
        requestHelper.expectSuccessResponse(response, 200);
      }).toThrow();
    });

    it('should throw when schema property is missing', () => {
      const response = {
        status: 200,
        body: {
          id: '123',
        },
      } as Response;

      const schema = {
        id: expect.any(String),
        name: expect.any(String),
      };

      expect(() => {
        requestHelper.expectSuccessResponse(response, 200, schema);
      }).toThrow();
    });
  });
});
