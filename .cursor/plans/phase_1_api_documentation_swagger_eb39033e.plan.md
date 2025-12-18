---
name: Phase 1 API Documentation Swagger
overview: Detailed implementation plan for setting up Swagger/OpenAPI documentation with decorators for all controllers and DTOs
todos:
  - id: swagger-config
    content: Add Swagger path configuration to app.config.ts and app.config.factory.ts
    status: completed
  - id: swagger-main
    content: Setup Swagger UI in main.ts with DocumentBuilder configuration including JWT and cookie auth
    status: completed
  - id: swagger-auth-controller
    content: Add Swagger decorators to auth.controller.ts (ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth)
    status: completed
  - id: swagger-categories-controller
    content: Add Swagger decorators to categories.controller.ts
    status: completed
  - id: swagger-transactions-controller
    content: Add Swagger decorators to transactions.controller.ts including query parameters
    status: completed
  - id: swagger-users-controller
    content: Add Swagger decorators to users.controller.ts
    status: completed
  - id: swagger-app-controller
    content: Add Swagger decorators to app.controller.ts
    status: completed
  - id: swagger-auth-dtos
    content: Add @ApiProperty decorators to all auth DTOs (register, login, verify-email, auth-response)
    status: completed
  - id: swagger-categories-dtos
    content: Add @ApiProperty decorators to all categories DTOs
    status: completed
  - id: swagger-transactions-dtos
    content: Add @ApiProperty decorators to all transactions DTOs including query and statistics DTOs
    status: in_progress
  - id: swagger-users-dtos
    content: Add @ApiProperty decorators to all users DTOs
    status: pending
  - id: swagger-script-update
    content: Update generate-openapi.ts script to match main.ts configuration
    status: pending
  - id: swagger-testing
    content: Test Swagger UI locally and verify all endpoints are documented correctly
    status: pending
  - id: swagger-spec-validation
    content: Generate OpenAPI spec and validate completeness and correctness
    status: pending
---

# Phase 1: API Documentation with Swagger/OpenAPI

## Overview

This phase implements comprehensive API documentation using NestJS Swagger. The goal is to have a fully documented API with interactive Swagger UI and a complete OpenAPI specification that can be used for frontend type generation.

## Step 1: Setup Swagger UI in Application

### 1.1 Add Swagger Configuration to App Config

**File:** `src/config/app.config.ts`**Changes:**

- Add `swaggerPath` property to `AppConfig` interface (default: `/api/docs`)
- Add validation schema for swagger path

**File:** `src/config/app.config.factory.ts`**Changes:**

- Add `swaggerPath` to config values from `SWAGGER_PATH` environment variable
- Default to `/api/docs` if not provided

### 1.2 Setup Swagger in main.ts

**File:** `src/main.ts`**Implementation:**

1. Import `SwaggerModule` and `DocumentBuilder` from `@nestjs/swagger`
2. Import `AppConfigService` (already imported)
3. After app creation, check if not in production environment
4. Create `DocumentBuilder` configuration:

   ```typescript
   const config = new DocumentBuilder()
     .setTitle('Track My Money API')
     .setDescription('API documentation for Track My Money application')
     .setVersion('1.0')
     .addBearerAuth(
       {
         type: 'http',
         scheme: 'bearer',
         bearerFormat: 'JWT',
         name: 'JWT',
         description: 'Enter JWT token',
         in: 'header',
       },
       'JWT-auth',
     )
     .addCookieAuth('refreshToken', {
       type: 'apiKey',
       in: 'cookie',
       name: 'refreshToken',
     })
     .addTag('auth', 'Authentication endpoints')
     .addTag('categories', 'Category management endpoints')
     .addTag('transactions', 'Transaction management endpoints')
     .addTag('users', 'User management endpoints')
     .build();
   ```

5. Create Swagger document: `SwaggerModule.createDocument(app, config)`
6. Setup Swagger UI: `SwaggerModule.setup(configService.app.swaggerPath, app, document)`
7. Only enable in non-production environments

## Step 2: Add Swagger Decorators to Controllers

### 2.1 Auth Controller

**File:** `src/auth/auth.controller.ts`**Decorators to add:**

1. `@ApiTags('auth')` - Class level
2. For `POST /auth/register`:

- `@ApiOperation({ summary: 'Register new user', description: 'Creates a new user account and sends verification email' })`
- `@ApiBody({ type: RegisterDto })`
- `@ApiResponse({ status: 201, description: 'User successfully registered', type: UserResponseDto })`
- `@ApiResponse({ status: 400, description: 'Validation error or user already exists' })`
- `@ApiResponse({ status: 429, description: 'Too many requests' })`

3. For `POST /auth/verify-email`:

- `@ApiOperation({ summary: 'Verify email address', description: 'Verifies user email with token sent to email' })`
- `@ApiBody({ type: VerifyEmailDto })`
- `@ApiResponse({ status: 200, description: 'Email successfully verified' })`
- `@ApiResponse({ status: 400, description: 'Invalid or expired token' })`

4. For `POST /auth/login`:

- `@ApiOperation({ summary: 'Login user', description: 'Authenticates user and returns access token. Sets refresh token in HTTP-only cookie.' })`
- `@ApiBody({ type: LoginDto })`
- `@ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })`
- `@ApiResponse({ status: 401, description: 'Invalid credentials' })`
- `@ApiResponse({ status: 403, description: 'Email not verified' })`

5. For `POST /auth/refresh`:

- `@ApiOperation({ summary: 'Refresh access token', description: 'Generates new access token using refresh token from cookie' })`
- `@ApiResponse({ status: 200, description: 'Token refreshed successfully', type: Omit<AuthResponseDto, 'user'> })`
- `@ApiResponse({ status: 400, description: 'Refresh token not provided' })`
- `@ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })`

6. For `POST /auth/logout`:

- `@ApiBearerAuth('JWT-auth')`
- `@ApiOperation({ summary: 'Logout user', description: 'Invalidates current refresh token and logs out user' })`
- `@ApiResponse({ status: 200, description: 'Logout successful' })`
- `@ApiResponse({ status: 401, description: 'Unauthorized' })`

7. For `POST /auth/logout-all`:

- `@ApiBearerAuth('JWT-auth')`
- `@ApiOperation({ summary: 'Logout from all devices', description: 'Invalidates all refresh tokens for the user' })`
- `@ApiResponse({ status: 200, description: 'Logged out from all devices' })`

### 2.2 Categories Controller

**File:** `src/categories/categories.controller.ts`**Decorators to add:**

1. `@ApiTags('categories')` - Class level
2. `@ApiBearerAuth('JWT-auth')` - Class level (all endpoints require auth)
3. For `POST /categories`:

- `@ApiOperation({ summary: 'Create category', description: 'Creates a new transaction category' })`
- `@ApiBody({ type: CreateCategoryDto })`
- `@ApiResponse({ status: 201, description: 'Category created successfully', type: CategoryResponseDto })`
- `@ApiResponse({ status: 400, description: 'Validation error' })`

4. For `GET /categories`:

- `@ApiOperation({ summary: 'Get all categories', description: 'Retrieves all categories for the authenticated user, optionally filtered by transaction type' })`
- `@ApiQuery({ name: 'type', required: false, enum: TransactionType, description: 'Filter by transaction type' })`
- `@ApiResponse({ status: 200, description: 'Categories retrieved successfully', type: [CategoryResponseDto] })`

5. For `GET /categories/:id`:

- `@ApiOperation({ summary: 'Get category by ID', description: 'Retrieves a specific category by its ID' })`
- `@ApiParam({ name: 'id', description: 'Category UUID' })`
- `@ApiResponse({ status: 200, description: 'Category retrieved successfully', type: CategoryResponseDto })`
- `@ApiResponse({ status: 404, description: 'Category not found' })`

6. For `PUT /categories/:id`:

- `@ApiOperation({ summary: 'Update category', description: 'Updates an existing category' })`
- `@ApiParam({ name: 'id', description: 'Category UUID' })`
- `@ApiBody({ type: UpdateCategoryDto })`
- `@ApiResponse({ status: 200, description: 'Category updated successfully', type: CategoryResponseDto })`
- `@ApiResponse({ status: 404, description: 'Category not found' })`

7. For `DELETE /categories/:id`:

- `@ApiOperation({ summary: 'Delete category', description: 'Soft deletes a category' })`
- `@ApiParam({ name: 'id', description: 'Category UUID' })`
- `@ApiResponse({ status: 204, description: 'Category deleted successfully' })`
- `@ApiResponse({ status: 404, description: 'Category not found' })`

### 2.3 Transactions Controller

**File:** `src/transactions/transactions.controller.ts`**Decorators to add:**

1. `@ApiTags('transactions')` - Class level
2. `@ApiBearerAuth('JWT-auth')` - Class level
3. For `POST /transactions`:

- `@ApiOperation({ summary: 'Create transaction', description: 'Creates a new transaction' })`
- `@ApiBody({ type: CreateTransactionDto })`
- `@ApiResponse({ status: 201, description: 'Transaction created successfully', type: TransactionResponseDto })`
- `@ApiResponse({ status: 400, description: 'Validation error' })`
- `@ApiResponse({ status: 404, description: 'Category not found' })`

4. For `GET /transactions`:

- `@ApiOperation({ summary: 'Get all transactions', description: 'Retrieves paginated list of transactions with optional filtering' })`
- `@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })`
- `@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })`
- `@ApiQuery({ name: 'type', required: false, enum: TransactionType, description: 'Filter by transaction type' })`
- `@ApiQuery({ name: 'categoryId', required: false, type: String, description: 'Filter by category ID' })`
- `@ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO 8601)' })`
- `@ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })`
- `@ApiResponse({ status: 200, description: 'Transactions retrieved successfully', schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/TransactionResponseDto' } }, total: { type: 'number' }, page: { type: 'number' }, limit: { type: 'number' } } } })`

5. For `GET /transactions/statistics`:

- `@ApiOperation({ summary: 'Get transaction statistics', description: 'Retrieves aggregated statistics for transactions' })`
- `@ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (ISO 8601)' })`
- `@ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (ISO 8601)' })`
- `@ApiQuery({ name: 'currencyCode', required: false, enum: CurrencyCode, description: 'Filter by currency' })`
- `@ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: TransactionStatisticsResponseDto })`

6. For `GET /transactions/:id`:

- `@ApiOperation({ summary: 'Get transaction by ID', description: 'Retrieves a specific transaction by its ID' })`
- `@ApiParam({ name: 'id', description: 'Transaction UUID' })`
- `@ApiResponse({ status: 200, description: 'Transaction retrieved successfully', type: TransactionResponseDto })`
- `@ApiResponse({ status: 404, description: 'Transaction not found' })`

7. For `PATCH /transactions/:id`:

- `@ApiOperation({ summary: 'Update transaction', description: 'Updates an existing transaction' })`
- `@ApiParam({ name: 'id', description: 'Transaction UUID' })`
- `@ApiBody({ type: UpdateTransactionDto })`
- `@ApiResponse({ status: 200, description: 'Transaction updated successfully', type: TransactionResponseDto })`
- `@ApiResponse({ status: 404, description: 'Transaction not found' })`

8. For `DELETE /transactions/:id`:

- `@ApiOperation({ summary: 'Delete transaction', description: 'Soft deletes a transaction' })`
- `@ApiParam({ name: 'id', description: 'Transaction UUID' })`
- `@ApiResponse({ status: 204, description: 'Transaction deleted successfully' })`
- `@ApiResponse({ status: 404, description: 'Transaction not found' })`

### 2.4 Users Controller

**File:** `src/users/users.controller.ts`**Decorators to add:**

1. `@ApiTags('users')` - Class level
2. `@ApiBearerAuth('JWT-auth')` - Class level
3. For `GET /users/me`:

- `@ApiOperation({ summary: 'Get current user', description: 'Retrieves the authenticated user profile' })`
- `@ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })`
- `@ApiResponse({ status: 401, description: 'Unauthorized' })`

4. For `PATCH /users/me`:

- `@ApiOperation({ summary: 'Update current user profile', description: 'Updates the authenticated user profile' })`
- `@ApiBody({ type: UpdateUserDto })`
- `@ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })`

5. For `GET /users/:id`:

- `@ApiOperation({ summary: 'Get user by ID', description: 'Retrieves a user by ID (Admin only)' })`
- `@ApiParam({ name: 'id', description: 'User UUID' })`
- `@ApiResponse({ status: 200, description: 'User retrieved successfully', type: UserResponseDto })`
- `@ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })`
- `@ApiResponse({ status: 404, description: 'User not found' })`

6. For `PATCH /users/:id/role`:

- `@ApiOperation({ summary: 'Update user role', description: 'Updates user role (Super Admin only)' })`
- `@ApiParam({ name: 'id', description: 'User UUID' })`
- `@ApiBody({ type: UpdateRoleDto })`
- `@ApiResponse({ status: 200, description: 'User role updated successfully', type: UserResponseDto })`
- `@ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })`

### 2.5 App Controller

**File:** `src/app.controller.ts`**Decorators to add:**

1. `@ApiTags('app')` - Class level
2. For `GET /`:

- `@ApiOperation({ summary: 'Health check', description: 'Returns a simple health check message' })`
- `@ApiResponse({ status: 200, description: 'Service is running', schema: { type: 'string', example: 'Hello World!' } })`

## Step 3: Add Swagger Decorators to DTOs

### 3.1 Auth DTOs

**File:** `src/auth/dto/register.dto.ts`

- Add `@ApiProperty()` to `email` with example: `'user@example.com'`
- Add `@ApiProperty()` to `password` with example: `'SecurePass123!'`, minLength: 8
- Add `@ApiPropertyOptional()` to `countryCode` with enum and example
- Add `@ApiPropertyOptional()` to `baseCurrencyCode` with enum and example

**File:** `src/auth/dto/login.dto.ts`

- Add `@ApiProperty()` to `email` with example: `'user@example.com'`
- Add `@ApiProperty()` to `password` with example: `'password123'`

**File:** `src/auth/dto/verify-email.dto.ts`

- Add `@ApiProperty()` to `token` with description and example

**File:** `src/auth/dto/auth-response.dto.ts`

- Add `@ApiProperty()` to `accessToken` with description
- Add `@ApiProperty()` to `user` with type: `UserResponseDto`

### 3.2 Categories DTOs

**File:** `src/categories/dto/create-category.dto.ts`

- Add `@ApiProperty()` to all fields with descriptions and examples
- Include enum types where applicable

**File:** `src/categories/dto/update-category.dto.ts`

- Add `@ApiPropertyOptional()` to all optional fields
- Add descriptions and examples

**File:** `src/categories/dto/category-response.dto.ts`

- Add `@ApiProperty()` to all exposed fields
- Add `@ApiHideProperty()` to excluded fields (userId, deletedAt)

### 3.3 Transactions DTOs

**File:** `src/transactions/dto/create-transaction.dto.ts`

- Add `@ApiProperty()` to `categoryId` with format: 'uuid' and example
- Add `@ApiProperty()` to `type` with enum: `TransactionType` and example
- Add `@ApiProperty()` to `amount` with description: 'Positive number as string' and example: `'100.50'`
- Add `@ApiProperty()` to `currencyCode` with enum and example
- Add `@ApiProperty()` to `date` with format: 'date-time' and example
- Add `@ApiPropertyOptional()` to `description` with maxLength: 500

**File:** `src/transactions/dto/update-transaction.dto.ts`

- Add `@ApiPropertyOptional()` to all fields with descriptions

**File:** `src/transactions/dto/transaction-query.dto.ts`

- Add `@ApiPropertyOptional()` to pagination fields (page, limit)
- Add `@ApiPropertyOptional()` to filter fields (type, categoryId, startDate, endDate)
- Include descriptions and examples

**File:** `src/transactions/dto/transaction-statistics-query.dto.ts`

- Add `@ApiPropertyOptional()` to date range and currency filters
- Include descriptions and examples

**File:** `src/transactions/dto/transaction-response.dto.ts`

- Add `@ApiProperty()` to all exposed fields
- Add `@ApiProperty()` to `category` with type: `CategoryResponseDto`
- Add `@ApiHideProperty()` to excluded fields (userId, deletedAt)

**File:** `src/transactions/dto/transaction-statistics-response.dto.ts`

- Add `@ApiProperty()` to all statistics fields with descriptions

### 3.4 Users DTOs

**File:** `src/users/dto/update-user.dto.ts`

- Add `@ApiPropertyOptional()` to all optional fields with descriptions

**File:** `src/users/dto/update-role.dto.ts`

- Add `@ApiProperty()` to `role` with enum: `UserRole` and description

**File:** `src/users/dto/user-response.dto.ts`

- Add `@ApiProperty()` to all exposed fields
- Add `@ApiHideProperty()` to excluded fields (password, deletedAt, etc.)

## Step 4: Update OpenAPI Generation Script

**File:** `scripts/generate-openapi.ts`**Changes:**

1. Ensure the script uses the same configuration as main.ts
2. Add cookie auth to DocumentBuilder (if not already present)
3. Verify output path and format
4. Add validation that all endpoints are documented

## Step 5: Testing and Verification

### 5.1 Local Testing

1. Start the application: `pnpm dev`
2. Navigate to Swagger UI: `http://localhost:3000/api/docs`
3. Verify all endpoints are visible
4. Test authentication flow:

- Register endpoint
- Login endpoint (verify cookie is set)
- Use JWT token in protected endpoints
- Test refresh token endpoint

5. Test each endpoint documentation:

- Verify request/response schemas
- Verify examples are correct
- Verify error responses are documented

### 5.2 OpenAPI Spec Generation

1. Run: `pnpm generate:openapi`
2. Verify `openapi.json` is generated
3. Validate the spec:

- All endpoints are present
- All DTOs have schemas
- Authentication schemes are correct
- No missing required fields

4. Test spec with OpenAPI validator tools
5. Verify frontend can consume the spec for type generation

### 5.3 Documentation Quality Check

1. Verify all endpoints have:

- Summary and description
- Request/response examples
- Error responses documented
- Proper authentication decorators

2. Verify all DTOs have:

- Property descriptions
- Examples
- Correct types and formats

3. Check that excluded fields don't appear in docs

## Implementation Notes

- Use `@ApiBearerAuth('JWT-auth')` for endpoints requiring JWT token in Authorization header
- Use `@ApiCookieAuth('refreshToken')` for endpoints using refresh token cookie
- Use `@ApiHideProperty()` for fields marked with `@Exclude()` in response DTOs
- Use `@ApiPropertyOptional()` for optional fields (marked with `@IsOptional()`)
- Include realistic examples in all `@ApiProperty()` decorators
