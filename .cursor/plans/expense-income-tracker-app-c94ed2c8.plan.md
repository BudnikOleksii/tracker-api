---
name: Expense/Income Tracking NestJS Application Plan
overview: ''
todos:
  - id: a41dc8a2-1985-46c5-a736-dcab2051b4d2
    content: Create Prisma schema with User, RefreshToken, Category, and Transaction models including all fields, relations, and enums
    status: pending
  - id: ee1960a4-9da5-4ab0-9765-7cc220cb0513
    content: Generate Prisma client and create initial database migration
    status: pending
  - id: d589a3f1-060b-4f95-81b7-d60c9aebf618
    content: Implement core module with guards (JwtAuthGuard, RolesGuard), filters (GlobalExceptionFilter), interceptors, and decorators
    status: pending
  - id: 74006f71-7728-474c-a1bf-64e9ff233f6f
    content: Create shared module with EmailService for sending verification emails and utility functions
    status: pending
  - id: 1effa156-6364-405c-938d-30a7505448d4
    content: Implement auth module with registration, email verification, login, refresh token rotation, and logout functionality
    status: pending
  - id: 75946abe-da6a-4f8a-b5b0-0a856df71cd7
    content: Create users module with profile management and role update endpoints (admin only)
    status: pending
  - id: 386ba194-74a7-47be-a110-032f15696c86
    content: Implement categories module with user-scoped category and subcategory CRUD operations
    status: pending
  - id: 9942413f-6cdf-4d4d-844a-c50316b374de
    content: Create transactions module with CRUD operations, filtering, and statistics endpoints
    status: pending
  - id: 6283a119-9927-48c1-91f9-13a93f775c39
    content: Integrate all modules into AppModule, configure global pipes, filters, and interceptors in main.ts
    status: pending
  - id: 94acae8f-7d2d-470d-adcf-722bfa903371
    content: Set up environment configuration with validation using @nestjs/config and Joi
    status: pending
---

# Expense/Income Tracking NestJS Application Plan

This plan is split into 4 independent phases that can be executed separately.

## Phase 1: Database Schema, Migrations, and Seeding

### Database Schema (Prisma)

**User Model** (`prisma/schema.prisma`)

- `id` (UUID, primary key)
- `email` (unique, indexed)
- `passwordHash` (hashed with bcrypt)
- `emailVerified` (boolean, default false)
- `emailVerificationToken` (optional string, nullable)
- `emailVerificationTokenExpiresAt` (optional DateTime, nullable)
- `countryCode` (string, nullable)
- `ipAddress` (string, nullable)
- `userAgent` (string, nullable)
- `role` (enum: USER, ADMIN, SUPER_ADMIN, default USER)
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)
- Relations: `refreshTokens`, `categories`, `transactions`

**RefreshToken Model**

- `id` (UUID, primary key)
- `userId` (foreign key to User)
- `token` (string, unique, indexed)
- `deviceInfo` (string, nullable - stores device identifier)
- `ipAddress` (string, nullable)
- `userAgent` (string, nullable)
- `expiresAt` (DateTime)
- `replacedByTokenId` (UUID, nullable - for token rotation)
- `revokedAt` (DateTime, nullable)
- `createdAt`, `updatedAt`
- Relations: `user`, `replacedByToken` (self-relation)

**Category Model**

- `id` (UUID, primary key)
- `userId` (foreign key to User)
- `name` (string)
- `parentCategoryId` (UUID, nullable - for subcategories)
- `createdAt`, `updatedAt`, `deletedAt`
- Relations: `user`, `parentCategory`, `subcategories`, `transactions`
- Unique constraint: `userId` + `name` + `parentCategoryId` (to prevent duplicates per user)

**Transaction Model**

- `id` (UUID, primary key)
- `userId` (foreign key to User)
- `categoryId` (foreign key to Category)
- `type` (enum: EXPENSE, INCOME)
- `amount` (Decimal - precise currency handling)
- `currency` (string - ISO 4217 currency code, e.g., "UAH", "USD")
- `date` (DateTime)
- `description` (string, nullable)
- `createdAt`, `updatedAt`, `deletedAt`
- Relations: `user`, `category`

### Enums

- `UserRole`: USER, ADMIN, SUPER_ADMIN
- `TransactionType`: EXPENSE, INCOME

### Seeding Strategy

- Create seed script (`prisma/seeds/index.ts`) that:

1. Creates a test user (or uses existing)
2. Parses `transactions-02.03.25.json`
3. Creates categories and subcategories from transaction data (unique per user)
4. Creates transactions linked to categories
5. Handles date parsing from "MM/DD/YYYY HH:mm:ss" format
6. Maps transaction types (Expense → EXPENSE, Income → INCOME)

## Phase 2: User Management System (Auth & Users Modules)

### Core Module (`src/core/`)

- **Guards**: `JwtAuthGuard`, `RolesGuard`
- **Filters**: `GlobalExceptionFilter` (Prisma error handling)
- **Interceptors**: `ResponseTransformInterceptor`
- **Decorators**: `Roles`, `CurrentUser`, `Public`
- **Constants**: Role enums, error messages

### Auth Module (`src/auth/`)

- **AuthService**:
- `register()` - create user, send verification email
- `verifyEmail()` - verify email token
- `login()` - authenticate, create access/refresh tokens
- `refreshTokens()` - rotate refresh tokens
- `logout()` - revoke refresh token
- `logoutAll()` - revoke all user tokens
- **AuthController**:
- `POST /auth/register`
- `POST /auth/verify-email`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- **DTOs**: `RegisterDto`, `LoginDto`, `VerifyEmailDto`, `RefreshTokenDto`, `AuthResponseDto`
- **Strategies**: `JwtStrategy`, `JwtRefreshStrategy` (Passport)

### Users Module (`src/users/`)

- **UsersService**:
- `findById()`, `findByEmail()`
- `updateProfile()`
- `updateRole()` (admin only)
- **UsersController**:
- `GET /users/me`
- `PATCH /users/me`
- `GET /users/:id` (admin only)
- `PATCH /users/:id/role` (super admin only)
- **DTOs**: `UpdateUserDto`, `UserResponseDto`

### Shared Module (`src/shared/`)

- **EmailService**: Send verification emails (using nodemailer or similar)
- **Utils**: Date formatting, currency validation
- **Types**: Common types/interfaces

### Authentication Flow

1. Registration: Hash password, create user with unverified email, generate verification token (24h expiry), send email
2. Email Verification: Validate token, mark email as verified, clear token
3. Login: Validate credentials, create access token (15min) + refresh token (7 days), store refresh token with device info
4. Refresh: Validate refresh token, create new access + refresh tokens, mark old refresh token as replaced
5. Logout: Revoke refresh token

## Phase 3: Categories Module

### Categories Module (`src/categories/`)

- **CategoriesService**:
- `create()` - create category/subcategory (user-scoped)
- `findAll()` - get user's categories with subcategories (tree structure)
- `findOne()`, `update()`, `remove()` (soft delete)
- `validateCategoryOwnership()` - ensure user owns category
- **CategoriesController**:
- `POST /categories`
- `GET /categories`
- `GET /categories/:id`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- **DTOs**: `CreateCategoryDto`, `UpdateCategoryDto`, `CategoryResponseDto`

### Features

- User-scoped categories (no overlap between users)
- Support for categories and subcategories (parent-child relationship)
- Unique category names per user (same name allowed if different parent)
- Soft delete support

## Phase 4: Transactions Module

### Transactions Module (`src/transactions/`)

- **TransactionsService**:
- `create()` - create transaction (validate category ownership)
- `findAll()` - with filters (date range, type, category, currency)
- `findOne()`, `update()`, `remove()` (soft delete)
- `getStatistics()` - aggregate by period, category, currency
- **TransactionsController**:
- `POST /transactions`
- `GET /transactions` (with query params: dateFrom, dateTo, type, categoryId, currency)
- `GET /transactions/:id`
- `PATCH /transactions/:id`
- `DELETE /transactions/:id`
- `GET /transactions/statistics`
- **DTOs**: `CreateTransactionDto`, `UpdateTransactionDto`, `TransactionResponseDto`, `TransactionQueryDto`

### Features

- Support for EXPENSE and INCOME transaction types
- Multi-currency support (store original currency only)
- Date-based filtering
- Category validation (must belong to user)
- Statistics aggregation

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_EXPIRES_IN` - Access token expiration (default: 15m)
- `JWT_REFRESH_SECRET` - Refresh token signing secret
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (default: 7d)
- `EMAIL_VERIFICATION_EXPIRES_IN` - Verification token expiration (default: 24h)
- `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS` - SMTP configuration

## Security & Validation

- Password hashing with bcrypt (10 rounds)
- JWT access tokens (short-lived)
- Refresh token rotation on each refresh
- Role-based access control (RBAC)
- Input validation with class-validator
- Rate limiting with @nestjs/throttler
- Email format validation
- Currency codes (ISO 4217)
- Amount precision (Decimal type)
- Date validation
- Category name uniqueness per user
