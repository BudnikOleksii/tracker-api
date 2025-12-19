import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

import { ResponseTransformInterceptor } from './response-transform.interceptor';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor<unknown>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    interceptor = new ResponseTransformInterceptor();

    mockExecutionContext = {
      switchToHttp: jest.fn(),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;

    mockCallHandler = {
      handle: jest.fn(),
    } as unknown as CallHandler;
  });

  describe('intercept', () => {
    it('should transform successful response with data', (done) => {
      const testData = { id: '1', name: 'Test' };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({
            success: true,
            data: testData,
            timestamp: expect.any(String),
          });
          expect(value.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );
          done();
        },
        error: done,
      });
    });

    it('should transform response with null data', (done) => {
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(null));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({
            success: true,
            data: null,
            timestamp: expect.any(String),
          });
          done();
        },
        error: done,
      });
    });

    it('should transform response with undefined data', (done) => {
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(undefined));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({
            success: true,
            data: undefined,
            timestamp: expect.any(String),
          });
          done();
        },
        error: done,
      });
    });

    it('should transform response with array data', (done) => {
      const testData = [{ id: '1' }, { id: '2' }];
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({
            success: true,
            data: testData,
            timestamp: expect.any(String),
          });
          done();
        },
        error: done,
      });
    });

    it('should transform response with string data', (done) => {
      const testData = 'test string';
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          expect(value).toEqual({
            success: true,
            data: testData,
            timestamp: expect.any(String),
          });
          done();
        },
        error: done,
      });
    });

    it('should generate ISO timestamp', (done) => {
      const testData = { test: 'data' };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      result.subscribe({
        next: (value) => {
          const timestamp = new Date(value.timestamp);
          expect(timestamp.toISOString()).toBe(value.timestamp);
          expect(Number.isNaN(timestamp.getTime())).toBe(false);
          done();
        },
        error: done,
      });
    });

    it('should call handler with correct context', () => {
      const testData = { id: '1' };
      const handleSpy = jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(handleSpy).toHaveBeenCalled();
    });
  });
});
