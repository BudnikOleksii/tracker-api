import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

import { Prisma } from '../../../generated/prisma/client';
import { ERROR_MESSAGES } from '../constants/error-messages.constant';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | undefined = 'Internal server error';
    let errors: string[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as {
          message?: string | string[];
          error?: string;
        };
        message = Array.isArray(responseObj.message)
          ? responseObj.message[0]
          : responseObj.message || responseObj.error || message;
        errors = Array.isArray(responseObj.message)
          ? responseObj.message
          : undefined;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;

      switch (exception.code) {
        case 'P2002':
          message = 'Unique constraint violation';
          if (exception.meta?.target) {
            const target = exception.meta.target as string[];
            if (target.includes('email')) {
              message = ERROR_MESSAGES.EMAIL_ALREADY_EXISTS;
            }
          }
          break;
        case 'P2003':
          message = 'Foreign key constraint violation';
          break;
        case 'P2025':
          message = 'Record not found';
          break;
        default:
          message = 'Database operation failed';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = ERROR_MESSAGES.VALIDATION_ERROR;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    this.logger.error(
      `Exception caught: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      {
        path: request.url,
        method: request.method,
        status,
      },
    );

    response.status(status).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
