import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../../generated/prisma/enums';

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    emailVerified: boolean;
    countryCode: string | null;
    baseCurrencyCode: string | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  };
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest<RequestWithUser>();

    if (!user) {
      return false;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}
