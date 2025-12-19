import { describe, beforeEach, it, expect, jest } from '@jest/globals';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../../generated/prisma/enums';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);

    const handler = jest.fn();
    const classRef = class TestController {};

    mockExecutionContext = {
      switchToHttp: jest.fn(),
      getHandler: jest.fn().mockReturnValue(handler),
      getClass: jest.fn().mockReturnValue(classRef),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as unknown as ExecutionContext;
  });

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          role: UserRole.USER,
        },
      };

      jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as unknown as ReturnType<ExecutionContext['switchToHttp']>);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when user has required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
      };

      jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as unknown as ReturnType<ExecutionContext['switchToHttp']>);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return true when user has one of the required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN, UserRole.SUPER_ADMIN]);

      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
        },
      };

      jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as unknown as ReturnType<ExecutionContext['switchToHttp']>);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it('should return false when user does not have required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'user@example.com',
          role: UserRole.USER,
        },
      };

      jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as unknown as ReturnType<ExecutionContext['switchToHttp']>);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should return false when user is missing from request', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      const mockRequest: { user?: unknown } = {};

      jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as unknown as ReturnType<ExecutionContext['switchToHttp']>);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(false);
    });

    it('should check metadata on handler and class', () => {
      const handler = jest.fn();
      const classRef = class TestController {};

      mockExecutionContext.getHandler = jest.fn().mockReturnValue(handler);
      mockExecutionContext.getClass = jest.fn().mockReturnValue(classRef);

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const mockRequest = {
        user: {
          id: 'user-id',
          email: 'test@example.com',
          role: UserRole.USER,
        },
      };

      jest.spyOn(mockExecutionContext, 'switchToHttp').mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn(),
        getNext: jest.fn(),
      } as unknown as ReturnType<ExecutionContext['switchToHttp']>);

      const getAllAndOverrideSpy = jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue(undefined);

      const result = guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(getAllAndOverrideSpy).toHaveBeenCalledWith(ROLES_KEY, [
        handler,
        classRef,
      ]);
    });
  });
});
