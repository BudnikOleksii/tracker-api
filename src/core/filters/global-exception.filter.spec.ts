import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import {
  ArgumentsHost,
  BadRequestException,
  HttpStatus,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { Prisma } from '../../../generated/prisma/client';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: Request;
  let mockResponse: Response;
  let loggerErrorSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();

    mockRequest = {
      url: '/test',
      method: 'GET',
    } as Request;

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getNext: jest.fn(),
      }),
    } as unknown as ArgumentsHost;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(
        (_message: string, _stack?: string, _context?: unknown) => undefined,
      );
  });

  describe('catch', () => {
    it('should handle HttpException with string message', () => {
      const exception = new BadRequestException('Invalid input');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid input',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should handle HttpException with object response', () => {
      const exception = new BadRequestException({
        message: 'Validation failed',
        error: 'Bad Request',
      });

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle HttpException with array message', () => {
      const exception = new BadRequestException([
        'Field 1 is required',
        'Field 2 is invalid',
      ]);

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Field 1 is required',
        errors: ['Field 1 is required', 'Field 2 is invalid'],
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle UnauthorizedException', () => {
      const exception = new UnauthorizedException('Unauthorized');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle NotFoundException', () => {
      const exception = new NotFoundException('Not found');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Not found',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle PrismaClientKnownRequestError with P2002 code for email', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['email'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.EMAIL_ALREADY_EXISTS,
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle PrismaClientKnownRequestError with P2002 code for category', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        {
          code: 'P2002',
          clientVersion: '5.0.0',
          meta: { target: ['userId', 'name', 'type'] },
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.CATEGORY_ALREADY_EXISTS,
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle PrismaClientKnownRequestError with P2003 code', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint violation',
        {
          code: 'P2003',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Foreign key constraint violation',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle PrismaClientKnownRequestError with P2025 code', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Record not found',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle PrismaClientKnownRequestError with unknown code', () => {
      const exception = new Prisma.PrismaClientKnownRequestError(
        'Database error',
        {
          code: 'P9999',
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Database operation failed',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle PrismaClientValidationError', () => {
      const exception = new Prisma.PrismaClientValidationError(
        'Validation error',
        {
          clientVersion: '5.0.0',
        },
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_ERROR,
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should handle generic Error', () => {
      const exception = new Error('Something went wrong');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Something went wrong',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Exception caught: Something went wrong',
        exception.stack,
        {
          path: '/test',
          method: 'GET',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      );
    });

    it('should handle unknown exception type', () => {
      const exception = { message: 'Unknown error' };

      filter.catch(exception as unknown as Error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'Internal server error',
        errors: undefined,
        timestamp: expect.any(String),
        path: '/test',
      });
    });

    it('should log error with correct context', () => {
      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Exception caught: Test error',
        exception.stack,
        {
          path: '/test',
          method: 'GET',
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      );
    });
  });
});
