import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import 'reflect-metadata';

import {
  ResponseTransformInterceptor,
  Response,
} from './response-transform.interceptor';

describe('ResponseTransformInterceptor', () => {
  let interceptor: ResponseTransformInterceptor<unknown>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockHandler: () => void;

  beforeEach(() => {
    interceptor = new ResponseTransformInterceptor();

    mockHandler = jest.fn();
    jest.spyOn(Reflect, 'getMetadata').mockReturnValue(undefined);

    mockExecutionContext = {
      switchToHttp: jest.fn(),
      getHandler: jest.fn(() => mockHandler),
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
    it('should transform successful response with data', async () => {
      const testData = { id: '1', name: 'Test' };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const value = (await firstValueFrom(result)) as Response<typeof testData>;

      expect(value).toEqual({
        success: true,
        data: testData,
        timestamp: expect.any(String),
      });
      expect(value.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });

    it('should transform response with null data', async () => {
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(null));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const value = await firstValueFrom(result);

      expect(value).toEqual({
        success: true,
        data: null,
        timestamp: expect.any(String),
      });
    });

    it('should transform response with undefined data', async () => {
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(undefined));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const value = await firstValueFrom(result);

      expect(value).toEqual({
        success: true,
        data: undefined,
        timestamp: expect.any(String),
      });
    });

    it('should transform response with array data', async () => {
      const testData = [{ id: '1' }, { id: '2' }];
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const value = await firstValueFrom(result);

      expect(value).toEqual({
        success: true,
        data: testData,
        timestamp: expect.any(String),
      });
    });

    it('should transform response with string data', async () => {
      const testData = 'test string';
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const value = await firstValueFrom(result);

      expect(value).toEqual({
        success: true,
        data: testData,
        timestamp: expect.any(String),
      });
    });

    it('should generate ISO timestamp', async () => {
      const testData = { test: 'data' };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const value = (await firstValueFrom(result)) as Response<typeof testData>;

      const timestamp = new Date(value.timestamp);
      expect(timestamp.toISOString()).toBe(value.timestamp);
      expect(Number.isNaN(timestamp.getTime())).toBe(false);
    });

    it('should call handler with correct context', () => {
      const testData = { id: '1' };
      const handleSpy = jest
        .spyOn(mockCallHandler, 'handle')
        .mockReturnValue(of(testData));

      interceptor.intercept(mockExecutionContext, mockCallHandler);

      expect(handleSpy).toHaveBeenCalled();
    });

    it('should return raw response for .json routes', async () => {
      const testData = { openapi: '3.0.0', info: { title: 'API' } };
      jest.spyOn(mockCallHandler, 'handle').mockReturnValue(of(testData));
      jest.spyOn(Reflect, 'getMetadata').mockReturnValue('openapi.json');

      const result = interceptor.intercept(
        mockExecutionContext,
        mockCallHandler,
      );

      const value = await firstValueFrom(result);

      expect(value).toEqual(testData);
      expect(value).not.toHaveProperty('success');
      expect(value).not.toHaveProperty('timestamp');
    });
  });
});
