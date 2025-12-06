---
name: Phase 2 User Management System
overview: Implement complete user management system with authentication (registration, email verification, login, refresh tokens, logout) and user profile management with role-based access control.
todos:
  - id: core-module-setup
    content: Create core module structure with guards (JwtAuthGuard, RolesGuard), filters (GlobalExceptionFilter), interceptors (ResponseTransformInterceptor), and decorators (Roles, CurrentUser, Public)
    status: pending
  - id: shared-module-setup
    content: Create shared module with EmailService using nodemailer, email configuration, and utility functions (date, currency validation)
    status: pending
  - id: auth-module-dtos
    content: Create auth DTOs (RegisterDto, LoginDto, VerifyEmailDto, RefreshTokenDto, AuthResponseDto) with class-validator decorators
    status: pending
  - id: auth-module-strategies
    content: Implement Passport strategies (JwtStrategy for access tokens, JwtRefreshStrategy for refresh tokens)
    status: pending
    dependencies:
      - core-module-setup
  - id: auth-module-service
    content: Implement AuthService with register, verifyEmail, login, refreshTokens, logout, and logoutAll methods
    status: pending
    dependencies:
      - shared-module-setup
      - auth-module-strategies
  - id: auth-module-controller
    content: Create AuthController with all authentication endpoints (register, verify-email, login, refresh, logout, logout-all)
    status: pending
    dependencies:
      - auth-module-service
      - core-module-setup
  - id: users-module-dtos
    content: Create users DTOs (UpdateUserDto, UserResponseDto) with validation
    status: pending
  - id: users-module-service
    content: Implement UsersService with findById, findByEmail, updateProfile, and updateRole methods
    status: pending
  - id: users-module-controller
    content: Create UsersController with profile management and role update endpoints (me, update profile, get user by id, update role)
    status: pending
    dependencies:
      - users-module-service
      - core-module-setup
  - id: email-config-setup
    content: Add email configuration to config module (email.config.ts, email.config.factory.ts) and update AppConfigService
    status: pending
  - id: module-integration
    content: Integrate all modules into AppModule, register global filters and interceptors in main.ts
    status: pending
    dependencies:
      - core-module-setup
      - shared-module-setup
      - auth-module-controller
      - users-module-controller
---

# Phase 2: User Management System - Detailed Implementation Plan

This plan implements the complete authentication and user management system for the expense/income tracking application.

## Overview

Phase 2 consists of four main modules:

1. **Core Module** - Shared infrastructure (guards, filters, interceptors, decorators)
2. **Shared Module** - Reusable services (EmailService, utilities)
3. **Auth Module** - Authentication and authorization flows
4. **Users Module** - User profile and role management

## Dependencies

Install required packages:

- `nodemailer` and `@types/nodemailer` for email functionality
- All other required packages (`@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`, `bcrypt`) are already installed

## Module 1: Core Module (`src/core/`)

### Structure

```
src/core/
├── guards/
│   ├── jwt-auth.guard.ts
│   └── roles.guard.ts
├── filters/
│   └── global-exception.filter.ts
├── interceptors/
│   └── response-transform.interceptor.ts
├── decorators/
│   ├── roles.decorator.ts
│   ├── current-user.decorator.ts
│   └── public.decorator.ts
├── constants/
│   ├── roles.constant.ts
│   └── error-messages.constant.ts
└── core.module.ts
```

### Implementation Details

**Guards** (`src/core/guards/`)

- `jwt-auth.guard.ts`: Extends `AuthGuard('jwt')` from Passport, validates JWT access tokens
- `roles.guard.ts`: Implements `CanActivate`, checks user roles against required roles from `@Roles()` decorator

**Filters** (`src/core/filters/`)

- `global-exception.filter.ts`: Implements `ExceptionFilter`, handles:
  - Prisma errors (unique constraint violations, foreign key violations, not found)
  - JWT errors (expired, invalid)
  - Validation errors from class-validator
  - Standard HTTP exceptions
  - Returns consistent error response format

**Interceptors** (`src/core/interceptors/`)

- `response-transform.interceptor.ts`: Implements `NestInterceptor`, transforms responses to consistent format:
  ```typescript
  { success: true, data: T, timestamp: string }
  ```

**Decorators** (`src/core/decorators/`)

- `roles.decorator.ts`: `@Roles(...roles: UserRole[])` - Sets metadata for role-based access
- `current-user.decorator.ts`: `@CurrentUser()` - Extracts user from request (from JWT payload)
- `public.decorator.ts`: `@Public()` - Marks routes as public (bypasses JWT guard)

**Constants** (`src/core/constants/`)

- `roles.constant.ts`: Exports `UserRole` enum from Prisma
- `error-messages.constant.ts`: Centralized error messages for consistency

**Module** (`src/core/core.module.ts`)

- Exports all guards, filters, interceptors, and decorators
- Makes them available globally or imports them where needed

## Module 2: Shared Module (`src/shared/`)

### Structure

```
src/shared/
├── services/
│   └── email.service.ts
├── utils/
│   ├── date.util.ts
│   └── currency.util.ts
├── types/
│   └── common.types.ts
└── shared.module.ts
```

### Implementation Details

**EmailService** (`src/shared/services/email.service.ts`)

- Uses `nodemailer` for sending emails
- Methods:
  - `sendVerificationEmail(email: string, token: string): Promise<void>`
  - `sendPasswordResetEmail(email: string, token: string): Promise<void>` (for future use)
- Configuration from environment variables:
  - `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM`
- Email template includes verification link with token
- Handles email sending errors gracefully

**Utils** (`src/shared/utils/`)

- `date.util.ts`: Date formatting and validation utilities
- `currency.util.ts`: Currency code validation (ISO 4217)

**Types** (`src/shared/types/`)

- `common.types.ts`: Shared interfaces and types (e.g., `ApiResponse<T>`, `PaginationMeta`)

**Module** (`src/shared/shared.module.ts`)

- Exports `EmailService` and utilities
- Can be imported by other modules

## Module 3: Auth Module (`src/auth/`)

### Structure

```
src/auth/
├── dto/
│   ├── register.dto.ts
│   ├── login.dto.ts
│   ├── verify-email.dto.ts
│   ├── refresh-token.dto.ts
│   └── auth-response.dto.ts
├── strategies/
│   ├── jwt.strategy.ts
│   └── jwt-refresh.strategy.ts
├── auth.service.ts
├── auth.controller.ts
└── auth.module.ts
```

### Implementation Details

**DTOs** (`src/auth/dto/`)

- `register.dto.ts`: `RegisterDto` with `email`, `password`, `countryCode?`, `baseCurrencyCode?`
  - Validation: email format, password strength (min 8 chars), country code enum, currency code enum
- `login.dto.ts`: `LoginDto` with `email`, `password`
- `verify-email.dto.ts`: `VerifyEmailDto` with `token`
- `refresh-token.dto.ts`: `RefreshTokenDto` with `refreshToken` (from cookie or body)
- `auth-response.dto.ts`: `AuthResponseDto` with `accessToken`, `refreshToken`, `user` (exclude password)

**Strategies** (`src/auth/strategies/`)

- `jwt.strategy.ts`: Extends `PassportStrategy(Strategy, 'jwt')`
  - Validates access token from Authorization header
  - Extracts user from token payload
  - Returns user object for `@CurrentUser()` decorator
- `jwt-refresh.strategy.ts`: Extends `PassportStrategy(Strategy, 'jwt-refresh')`
  - Validates refresh token from cookie or body
  - Extracts user and token info

**AuthService** (`src/auth/auth.service.ts`)

Methods:

- `register(dto: RegisterDto, ipAddress?: string, userAgent?: string)`:
  - Hash password with bcrypt (10 rounds)
  - Generate email verification token (UUID, 24h expiry)
  - Create user with `emailVerified: false`
  - Send verification email
  - Return user (without password)

- `verifyEmail(token: string)`:
  - Find user by token
  - Check token expiration
  - Set `emailVerified: true`, clear token fields
  - Return success

- `login(dto: LoginDto, ipAddress?: string, userAgent?: string)`:
  - Find user by email (check soft delete)
  - Verify password with bcrypt
  - Check if email is verified
  - Generate access token (15min) and refresh token (7 days)
  - Create RefreshToken record with device info
  - Return tokens and user

- `refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string)`:
  - Validate refresh token
  - Check if token is revoked or replaced
  - Check expiration
  - Generate new access and refresh tokens
  - Mark old refresh token as replaced (set `replacedByTokenId`)
  - Create new RefreshToken record
  - Return new tokens

- `logout(refreshToken: string)`:
  - Find refresh token
  - Set `revokedAt` timestamp

- `logoutAll(userId: string)`:
  - Revoke all user's refresh tokens (set `revokedAt`)

**AuthController** (`src/auth/auth.controller.ts`)

Endpoints:

- `POST /auth/register` - `@Public()`, `register()`
- `POST /auth/verify-email` - `@Public()`, `verifyEmail()`
- `POST /auth/login` - `@Public()`, `login()` (sets refresh token cookie)
- `POST /auth/refresh` - `@Public()`, `refreshTokens()` (reads from cookie or body)
- `POST /auth/logout` - `@UseGuards(JwtAuthGuard)`, `logout()` (reads from cookie)
- `POST /auth/logout-all` - `@UseGuards(JwtAuthGuard)`, `logoutAll()`

**Module** (`src/auth/auth.module.ts`)

- Imports: `JwtModule`, `PassportModule`, `SharedModule`
- Configures `JwtModule` with access and refresh token secrets
- Exports `AuthService` for use in other modules

## Module 4: Users Module (`src/users/`)

### Structure

```
src/users/
├── dto/
│   ├── update-user.dto.ts
│   └── user-response.dto.ts
├── users.service.ts
├── users.controller.ts
└── users.module.ts
```

### Implementation Details

**DTOs** (`src/users/dto/`)

- `update-user.dto.ts`: `UpdateUserDto` with optional `countryCode?`, `baseCurrencyCode?`
  - Validation: country code enum, currency code enum
- `user-response.dto.ts`: `UserResponseDto` - user data without password, includes `emailVerified`, `role`

**UsersService** (`src/users/users.service.ts`)

Methods:

- `findById(id: string)`: Find user by ID (exclude soft-deleted)
- `findByEmail(email: string)`: Find user by email (exclude soft-deleted)
- `updateProfile(userId: string, dto: UpdateUserDto)`: Update user's own profile
- `updateRole(userId: string, newRole: UserRole)`: Update user role (admin only, cannot demote super admin)

**UsersController** (`src/users/users.controller.ts`)

Endpoints:

- `GET /users/me` - `@UseGuards(JwtAuthGuard)`, `getCurrentUser()`
- `PATCH /users/me` - `@UseGuards(JwtAuthGuard)`, `updateProfile()`
- `GET /users/:id` - `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)`, `getUserById()`
- `PATCH /users/:id/role` - `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles(UserRole.SUPER_ADMIN)`, `updateUserRole()`

**Module** (`src/users/users.module.ts`)

- Imports: `PrismaModule` (global), `CoreModule`
- Exports `UsersService`

## Integration

### Update `src/app.module.ts`

- Import `CoreModule`, `SharedModule`, `AuthModule`, `UsersModule`
- Register global exception filter, response interceptor in `main.ts`

### Update `src/main.ts`

- Apply `GlobalExceptionFilter` globally
- Apply `ResponseTransformInterceptor` globally
- Configure Swagger (optional) with JWT auth

### Environment Variables

Add to `.env`:

```
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-password
EMAIL_FROM=noreply@tracker.com
```

Update `src/config/` to include email configuration:

- `email.config.ts` - Email configuration interface and schema
- `email.config.factory.ts` - Email config factory
- Update `AppConfigService` to include email config

## Security Considerations

1. **Password Security**: bcrypt with 10 rounds
2. **Token Security**:
   - Short-lived access tokens (15min)
   - Refresh token rotation on each refresh
   - Refresh tokens stored in database with device tracking

3. **Email Verification**: Required before login
4. **Role-Based Access**: Guards enforce role requirements
5. **Input Validation**: All DTOs validated with class-validator
6. **Error Handling**: No sensitive information leaked in errors

## Testing Strategy

- Unit tests for each service method
- Integration tests for controllers
- E2E tests for authentication flows
- Test error scenarios (invalid tokens, expired tokens, unauthorized access)

## File Dependencies

- Uses existing [PrismaService](src/prisma/prisma.service.ts) for database operations
- Uses existing [AppConfigService](src/config/app-config.service.ts) for configuration
- Uses existing [Prisma schema](prisma/schema.prisma) with User and RefreshToken models
- Integrates with existing [main.ts](src/main.ts) validation pipe setup
