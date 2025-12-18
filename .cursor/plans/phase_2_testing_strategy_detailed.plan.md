# Phase 2: Testing Strategy - Detailed Implementation Plan

## Overview

This plan provides a comprehensive testing strategy for the tracker-api application, covering unit tests, integration tests, and end-to-end tests. The goal is to achieve minimum 80% code coverage for services and ensure all critical paths are tested.

## 2.1 Setup Test Infrastructure

### 2.1.1 Create Test Database Configuration

**File to create:** `test/config/test-database.config.ts`**Purpose:** Separate test database configuration from production**Implementation:**

```typescript
export const testDatabaseConfig = {
  url:
    process.env.TEST_DATABASE_URL ||
    'postgresql://tracker:tracker123@localhost:5432/tracker_test',
};
```

### 2.1.2 Create Test Setup File

**File to create:** `test/setup.ts`**Purpose:** Global test setup and teardown**Implementation:**

- Setup test database connection
- Run Prisma migrations before all tests
- Clean database after each test suite
- Configure test environment variables
- Setup global test utilities

**Key features:**

- Database connection management
- Migration runner
- Cleanup utilities
- Test timeout configuration

### 2.1.3 Create Test Helpers Directory

**Directory:** `test/helpers/`**Files to create:**

1. **`test/helpers/database.helper.ts`**

- `cleanDatabase()` - Truncate all tables
- `seedDatabase()` - Seed test data
- `resetDatabase()` - Reset to clean state
- `runMigrations()` - Run Prisma migrations

2. **`test/helpers/auth.helper.ts`**

- `generateTestAccessToken(userId, email, role)` - Generate JWT token
- `generateTestRefreshToken(userId)` - Generate refresh token
- `createTestUser(overrides?)` - Create test user with defaults
- `authenticateRequest(request, user)` - Add auth headers to request

3. **`test/helpers/request.helper.ts`**

- `makeRequest(app, method, path, options?)` - Generic request helper
- `expectErrorResponse(response, status, message?)` - Assert error response
- `expectSuccessResponse(response, status, schema?)` - Assert success response

### 2.1.4 Create Test Factories

**Directory:** `test/fixtures/`**Files to create:**

1. **`test/fixtures/user.factory.ts`**

   ```typescript
   export class UserFactory {
     static create(overrides?: Partial<User>): User;
     static createMany(count: number, overrides?: Partial<User>): User[];
     static createVerified(overrides?: Partial<User>): User;
     static createUnverified(overrides?: Partial<User>): User;
     static createAdmin(overrides?: Partial<User>): User;
   }
   ```

2. **`test/fixtures/category.factory.ts`**

   ```typescript
   export class CategoryFactory {
     static create(userId: string, overrides?: Partial<Category>): Category;
     static createIncome(
       userId: string,
       overrides?: Partial<Category>,
     ): Category;
     static createExpense(
       userId: string,
       overrides?: Partial<Category>,
     ): Category;
     static createWithParent(
       userId: string,
       parentId: string,
       overrides?: Partial<Category>,
     ): Category;
     static createMany(
       userId: string,
       count: number,
       overrides?: Partial<Category>,
     ): Category[];
   }
   ```

3. **`test/fixtures/transaction.factory.ts`**

   ```typescript
   export class TransactionFactory {
     static create(
       userId: string,
       categoryId: string,
       overrides?: Partial<Transaction>,
     ): Transaction;
     static createIncome(
       userId: string,
       categoryId: string,
       overrides?: Partial<Transaction>,
     ): Transaction;
     static createExpense(
       userId: string,
       categoryId: string,
       overrides?: Partial<Transaction>,
     ): Transaction;
     static createMany(
       userId: string,
       categoryId: string,
       count: number,
       overrides?: Partial<Transaction>,
     ): Transaction[];
   }
   ```

4. **`test/fixtures/refresh-token.factory.ts`**
   ```typescript
   export class RefreshTokenFactory {
     static create(
       userId: string,
       overrides?: Partial<RefreshToken>,
     ): RefreshToken;
     static createExpired(
       userId: string,
       overrides?: Partial<RefreshToken>,
     ): RefreshToken;
     static createRevoked(
       userId: string,
       overrides?: Partial<RefreshToken>,
     ): RefreshToken;
   }
   ```

### 2.1.5 Enhance Jest Configuration

**File to modify:** `package.json` (jest section)**Additions:**

```json
{
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s",
      "!**/*.spec.ts",
      "!**/*.interface.ts",
      "!**/*.dto.ts",
      "!**/main.ts",
      "!**/*.module.ts"
    ],
    "coverageDirectory": "../coverage",
    "coverageThreshold": {
      "global": {
        "branches": 70,
        "functions": 70,
        "lines": 70,
        "statements": 70
      },
      "./src/**/*.service.ts": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    },
    "testEnvironment": "node",
    "setupFilesAfterEnv": ["<rootDir>/../test/setup.ts"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
  }
}
```

### 2.1.6 Add Test Scripts

**File to modify:** `package.json` (scripts section)**Additions:**

```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern=spec.ts$ --testPathIgnorePatterns=integration|e2e",
    "test:integration": "jest --testPathPattern=integration.spec.ts$",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "test:cov": "jest --coverage",
    "test:cov:unit": "jest --coverage --testPathPattern=spec.ts$ --testPathIgnorePatterns=integration|e2e",
    "test:watch": "jest --watch",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand"
  }
}
```

### 2.1.7 Create Test Database Docker Service

**File to modify:** `docker-compose.yml`**Additions:**

```yaml
services:
  postgres-test:
    image: postgres:15-alpine
    container_name: tracker-postgres-test
    environment:
      POSTGRES_USER: tracker
      POSTGRES_PASSWORD: tracker123
      POSTGRES_DB: tracker_test
    ports:
      - '5433:5432'
    volumes:
      - postgres_test_data:/var/lib/postgresql/data
    networks:
      - tracker-network
```

## 2.2 Unit Tests for Services

### 2.2.1 AuthService Unit Tests

**File to create:** `src/auth/auth.service.spec.ts`**Test cases to cover:**

1. **register() method:**

- ✅ Successfully register new user
- ✅ Throw ConflictException when email already exists
- ✅ Hash password correctly
- ✅ Generate verification token
- ✅ Set token expiration (24 hours)
- ✅ Send verification email
- ✅ Return UserResponseDto
- ✅ Handle soft-deleted users

2. **verifyEmail() method:**

- ✅ Successfully verify email with valid token
- ✅ Throw BadRequestException for invalid token
- ✅ Throw BadRequestException for expired token
- ✅ Update user emailVerified flag
- ✅ Clear verification token fields

3. **login() method:**

- ✅ Successfully login with valid credentials
- ✅ Throw UnauthorizedException for non-existent user
- ✅ Throw UnauthorizedException for deleted user
- ✅ Throw UnauthorizedException for invalid password
- ✅ Throw UnauthorizedException for unverified email
- ✅ Generate access and refresh tokens
- ✅ Create refresh token record
- ✅ Return AuthResponseWithRefreshTokenDto
- ✅ Handle user without passwordHash

4. **refreshTokens() method:**

- ✅ Successfully refresh tokens with valid refresh token
- ✅ Throw UnauthorizedException for invalid refresh token
- ✅ Throw UnauthorizedException for revoked token
- ✅ Throw UnauthorizedException for replaced token
- ✅ Throw UnauthorizedException for expired token
- ✅ Throw UnauthorizedException for deleted user
- ✅ Generate new access and refresh tokens
- ✅ Mark old token as replaced
- ✅ Create new refresh token record

5. **logout() method:**

- ✅ Successfully logout with valid refresh token
- ✅ Revoke refresh token
- ✅ Handle non-existent token gracefully
- ✅ Handle already revoked token

6. **logoutAll() method:**

- ✅ Successfully logout from all devices
- ✅ Revoke all user's refresh tokens
- ✅ Handle user with no tokens

7. **Private methods (tested indirectly):**

- generateAccessToken()
- generateRefreshToken()
- mapUserToDto()
- getDeviceInfo()
- getRefreshTokenExpiresAt()
- parseExpiration()

**Mock dependencies:**

- UsersRepository
- RefreshTokensRepository
- JwtService
- EmailService
- AppConfigService

### 2.2.2 CategoriesService Unit Tests

**File to create:** `src/categories/categories.service.spec.ts`**Test cases to cover:**

1. **create() method:**

- ✅ Successfully create root category
- ✅ Successfully create subcategory with valid parent
- ✅ Throw ConflictException when category already exists
- ✅ Validate parent category ownership
- ✅ Validate parent category type match
- ✅ Return CategoryResponseDto

2. **findAll() method:**

- ✅ Return all root categories for user
- ✅ Filter by transaction type (INCOME/EXPENSE)
- ✅ Return empty array when no categories
- ✅ Only return user's own categories

3. **findOne() method:**

- ✅ Successfully find category by ID
- ✅ Throw NotFoundException for non-existent category
- ✅ Throw NotFoundException for deleted category
- ✅ Throw NotFoundException for other user's category

4. **update() method:**

- ✅ Successfully update category
- ✅ Throw NotFoundException for non-existent category
- ✅ Throw BadRequestException for circular reference (self)
- ✅ Throw BadRequestException for circular reference (ancestor)
- ✅ Validate parent category ownership
- ✅ Validate parent category type match
- ✅ Throw ConflictException when name/type/parent combination exists
- ✅ Prevent type change when has subcategories
- ✅ Prevent type change when parent type differs

5. **remove() method:**

- ✅ Successfully delete category
- ✅ Throw NotFoundException for non-existent category
- ✅ Throw ConflictException when category has subcategories
- ✅ Throw ConflictException when category has transactions

6. **Private methods:**

- validateCategoryOwnership()
- validateParentCategory()
- checkCircularReference()
- mapCategoryToDto()

**Mock dependencies:**

- CategoriesRepository

### 2.2.3 TransactionsService Unit Tests

**File to create:** `src/transactions/transactions.service.spec.ts`**Test cases to cover:**

1. **create() method:**

- ✅ Successfully create income transaction
- ✅ Successfully create expense transaction
- ✅ Validate category ownership
- ✅ Validate category type matches transaction type
- ✅ Throw NotFoundException for invalid category
- ✅ Return TransactionResponseDto

2. **findAll() method:**

- ✅ Return paginated transactions
- ✅ Filter by date range
- ✅ Filter by category
- ✅ Filter by type
- ✅ Sort by date (asc/desc)
- ✅ Sort by amount (asc/desc)
- ✅ Return only user's transactions
- ✅ Handle empty results

3. **findOne() method:**

- ✅ Successfully find transaction by ID
- ✅ Throw NotFoundException for non-existent transaction
- ✅ Throw NotFoundException for other user's transaction

4. **update() method:**

- ✅ Successfully update transaction
- ✅ Validate category ownership
- ✅ Validate category type matches transaction type
- ✅ Throw NotFoundException for non-existent transaction

5. **remove() method:**

- ✅ Successfully delete transaction
- ✅ Throw NotFoundException for non-existent transaction
- ✅ Throw NotFoundException for other user's transaction

6. **getStatistics() method:**

- ✅ Calculate total income for date range
- ✅ Calculate total expenses for date range
- ✅ Calculate net balance
- ✅ Filter by category
- ✅ Filter by type
- ✅ Handle empty results
- ✅ Group by category
- ✅ Group by month

**Mock dependencies:**

- TransactionsRepository
- CategoriesRepository

### 2.2.4 UsersService Unit Tests

**File to create:** `src/users/users.service.spec.ts`**Test cases to cover:**

1. **findAll() method:**

- ✅ Return paginated users (admin only)
- ✅ Filter by role
- ✅ Filter by email
- ✅ Sort by created date
- ✅ Handle empty results

2. **findOne() method:**

- ✅ Successfully find user by ID
- ✅ Throw NotFoundException for non-existent user
- ✅ Return UserResponseDto

3. **update() method:**

- ✅ Successfully update own profile
- ✅ Successfully update other user (admin)
- ✅ Throw NotFoundException for non-existent user
- ✅ Validate country code
- ✅ Validate currency code

4. **updateRole() method:**

- ✅ Successfully update user role (admin only)
- ✅ Throw NotFoundException for non-existent user
- ✅ Validate role value

5. **remove() method:**

- ✅ Successfully soft delete user
- ✅ Throw NotFoundException for non-existent user
- ✅ Prevent self-deletion

**Mock dependencies:**

- UsersRepository

### 2.2.5 EmailService Unit Tests

**File to create:** `src/shared/services/email.service.spec.ts`**Test cases to cover:**

1. **sendVerificationEmail() method:**

- ✅ Successfully send verification email
- ✅ Use correct email template
- ✅ Include verification token in email
- ✅ Handle email sending errors

2. **sendPasswordResetEmail() method (if exists):**

- ✅ Successfully send password reset email
- ✅ Include reset token in email

**Mock dependencies:**

- Nodemailer transport

## 2.3 Unit Tests for Repositories

### 2.3.1 UsersRepository Unit Tests

**File to create:** `src/users/repositories/users.repository.spec.ts`**Test cases to cover:**

1. **findUnique() method:**

- ✅ Find user by ID
- ✅ Find user by email
- ✅ Return null for non-existent user
- ✅ Exclude soft-deleted users

2. **findFirst() method:**

- ✅ Find first matching user
- ✅ Apply filters correctly
- ✅ Return null when no match

3. **findMany() method:**

- ✅ Return paginated results
- ✅ Apply filters
- ✅ Apply sorting
- ✅ Exclude soft-deleted users

4. **create() method:**

- ✅ Create user with all fields
- ✅ Set default values
- ✅ Return created user

5. **update() method:**

- ✅ Update user fields
- ✅ Return updated user

6. **softDelete() method:**

- ✅ Set deletedAt timestamp
- ✅ Preserve other fields

**Mock dependencies:**

- PrismaService (PrismaClient)

### 2.3.2 CategoriesRepository Unit Tests

**File to create:** `src/categories/repositories/categories.repository.spec.ts`**Test cases to cover:**

1. **findUnique() method:**

- ✅ Find category by ID
- ✅ Include parent category
- ✅ Return null for non-existent category

2. **findByUserId() method:**

- ✅ Return user's categories
- ✅ Filter by type
- ✅ Return hierarchical structure
- ✅ Exclude soft-deleted categories

3. **checkCategoryExists() method:**

- ✅ Return true when category exists
- ✅ Return false when category doesn't exist
- ✅ Exclude current category ID (for updates)

4. **countSubcategoriesByParentId() method:**

- ✅ Return correct count
- ✅ Return 0 when no subcategories

5. **countTransactionsByCategoryId() method:**

- ✅ Return correct count
- ✅ Return 0 when no transactions

6. **create(), update(), softDelete() methods:**

- Similar to UsersRepository tests

**Mock dependencies:**

- PrismaService

### 2.3.3 TransactionsRepository Unit Tests

**File to create:** `src/transactions/repositories/transactions.repository.spec.ts`**Test cases to cover:**

1. **findMany() method:**

- ✅ Return paginated transactions
- ✅ Apply date range filters
- ✅ Apply category filters
- ✅ Apply type filters
- ✅ Apply sorting
- ✅ Include category relation
- ✅ Exclude soft-deleted transactions

2. **findUnique() method:**

- ✅ Find transaction by ID
- ✅ Include category
- ✅ Return null for non-existent transaction

3. **getStatistics() method:**

- ✅ Calculate totals correctly
- ✅ Apply filters
- ✅ Group by category
- ✅ Group by month
- ✅ Handle empty results

4. **create(), update(), softDelete() methods:**

- Similar to other repositories

**Mock dependencies:**

- PrismaService

### 2.3.4 RefreshTokensRepository Unit Tests

**File to create:** `src/auth/repositories/refresh-tokens.repository.spec.ts`**Test cases to cover:**

1. **findUnique() method:**

- ✅ Find token by token string
- ✅ Return null for non-existent token

2. **findUniqueWithUser() method:**

- ✅ Find token with user relation
- ✅ Return null for non-existent token

3. **create() method:**

- ✅ Create refresh token record
- ✅ Set expiration date
- ✅ Store device info

4. **update() method:**

- ✅ Update token fields
- ✅ Revoke token

5. **updateMany() method:**

- ✅ Update multiple tokens
- ✅ Revoke all user tokens

**Mock dependencies:**

- PrismaService

## 2.4 Unit Tests for Utilities and Helpers

### 2.4.1 Currency Utility Tests

**File to create:** `src/shared/utils/currency.util.spec.ts`**Test cases to cover:**

1. **formatCurrency() method (if exists):**

- ✅ Format different currencies correctly
- ✅ Handle decimal places
- ✅ Handle negative amounts
- ✅ Handle zero amounts

2. **convertCurrency() method (if exists):**

- ✅ Convert between currencies
- ✅ Handle exchange rates
- ✅ Round to appropriate decimal places

### 2.4.2 Date Utility Tests

**File to create:** `src/shared/utils/date.util.spec.ts`**Test cases to cover:**

1. **formatDate() method (if exists):**

- ✅ Format dates in different formats
- ✅ Handle timezones
- ✅ Handle invalid dates

2. **parseDateRange() method (if exists):**

- ✅ Parse date range strings
- ✅ Handle invalid formats
- ✅ Set default values

### 2.4.3 JWT Auth Guard Tests

**File to create:** `src/core/guards/jwt-auth.guard.spec.ts`**Test cases to cover:**

1. **canActivate() method:**

- ✅ Allow request with valid JWT token
- ✅ Deny request without token
- ✅ Deny request with invalid token
- ✅ Deny request with expired token
- ✅ Attach user to request object

**Mock dependencies:**

- JwtService
- ExecutionContext

### 2.4.4 Roles Guard Tests

**File to create:** `src/core/guards/roles.guard.spec.ts`**Test cases to cover:**

1. **canActivate() method:**

- ✅ Allow admin for admin-only routes
- ✅ Deny user for admin-only routes
- ✅ Allow user for user routes
- ✅ Handle missing user in request

**Mock dependencies:**

- Reflector
- ExecutionContext

### 2.4.5 Global Exception Filter Tests

**File to create:** `src/core/filters/global-exception.filter.spec.ts`**Test cases to cover:**

1. **catch() method:**

- ✅ Handle ValidationException
- ✅ Handle UnauthorizedException
- ✅ Handle NotFoundException
- ✅ Handle generic exceptions
- ✅ Log errors appropriately
- ✅ Return formatted error response

**Mock dependencies:**

- ArgumentsHost
- HttpException

### 2.4.6 Response Transform Interceptor Tests

**File to create:** `src/core/interceptors/response-transform.interceptor.spec.ts`**Test cases to cover:**

1. **intercept() method:**

- ✅ Transform successful responses
- ✅ Preserve error responses
- ✅ Add metadata to responses
- ✅ Handle null/undefined responses

**Mock dependencies:**

- CallHandler
- ExecutionContext

## 2.5 Integration Tests for Controllers

### 2.5.1 Auth Controller Integration Tests

**File to create:** `test/integration/auth.integration.spec.ts`**Test cases to cover:**

1. **POST /auth/register:**

- ✅ Register new user successfully
- ✅ Return 409 when email exists
- ✅ Validate request body
- ✅ Send verification email

2. **POST /auth/verify-email:**

- ✅ Verify email with valid token
- ✅ Return 400 for invalid token
- ✅ Return 400 for expired token

3. **POST /auth/login:**

- ✅ Login with valid credentials
- ✅ Return 401 for invalid credentials
- ✅ Return 401 for unverified email
- ✅ Set refresh token cookie
- ✅ Return access token

4. **POST /auth/refresh:**

- ✅ Refresh tokens successfully
- ✅ Return 401 for invalid refresh token
- ✅ Return 401 for revoked token
- ✅ Return new access and refresh tokens

5. **POST /auth/logout:**

- ✅ Logout successfully
- ✅ Revoke refresh token
- ✅ Handle missing refresh token

6. **POST /auth/logout-all:**

- ✅ Logout from all devices
- ✅ Revoke all refresh tokens
- ✅ Require authentication

**Setup:**

- Use real test database
- Clean database before each test
- Use test factories for data creation

### 2.5.2 Categories Controller Integration Tests

**File to create:** `test/integration/categories.integration.spec.ts`**Test cases to cover:**

1. **POST /categories:**

- ✅ Create category successfully
- ✅ Create subcategory successfully
- ✅ Return 409 when category exists
- ✅ Return 404 for invalid parent category
- ✅ Require authentication

2. **GET /categories:**

- ✅ Return user's categories
- ✅ Filter by type
- ✅ Return hierarchical structure
- ✅ Require authentication

3. **GET /categories/:id:**

- ✅ Return category by ID
- ✅ Return 404 for non-existent category
- ✅ Return 404 for other user's category
- ✅ Require authentication

4. **PATCH /categories/:id:**

- ✅ Update category successfully
- ✅ Return 404 for non-existent category
- ✅ Return 400 for circular reference
- ✅ Require authentication

5. **DELETE /categories/:id:**

- ✅ Delete category successfully
- ✅ Return 409 when has subcategories
- ✅ Return 409 when has transactions
- ✅ Require authentication

**Setup:**

- Authenticate test user
- Create test categories
- Clean up after tests

### 2.5.3 Transactions Controller Integration Tests

**File to create:** `test/integration/transactions.integration.spec.ts`**Test cases to cover:**

1. **POST /transactions:**

- ✅ Create transaction successfully
- ✅ Return 404 for invalid category
- ✅ Validate category type match
- ✅ Require authentication

2. **GET /transactions:**

- ✅ Return paginated transactions
- ✅ Filter by date range
- ✅ Filter by category
- ✅ Filter by type
- ✅ Sort correctly
- ✅ Require authentication

3. **GET /transactions/:id:**

- ✅ Return transaction by ID
- ✅ Return 404 for non-existent transaction
- ✅ Return 404 for other user's transaction
- ✅ Require authentication

4. **PATCH /transactions/:id:**

- ✅ Update transaction successfully
- ✅ Return 404 for non-existent transaction
- ✅ Require authentication

5. **DELETE /transactions/:id:**

- ✅ Delete transaction successfully
- ✅ Return 404 for non-existent transaction
- ✅ Require authentication

6. **GET /transactions/statistics:**

- ✅ Return statistics correctly
- ✅ Filter by date range
- ✅ Filter by category
- ✅ Group by category
- ✅ Group by month
- ✅ Require authentication

**Setup:**

- Authenticate test user
- Create test categories and transactions
- Test pagination and filtering

### 2.5.4 Users Controller Integration Tests

**File to create:** `test/integration/users.integration.spec.ts`**Test cases to cover:**

1. **GET /users:**

- ✅ Return paginated users (admin only)
- ✅ Filter by role
- ✅ Filter by email
- ✅ Return 403 for non-admin users
- ✅ Require authentication

2. **GET /users/profile:**

- ✅ Return current user profile
- ✅ Require authentication

3. **GET /users/:id:**

- ✅ Return user by ID (admin)
- ✅ Return 404 for non-existent user
- ✅ Return 403 for non-admin users
- ✅ Require authentication

4. **PATCH /users/profile:**

- ✅ Update own profile successfully
- ✅ Validate country code
- ✅ Validate currency code
- ✅ Require authentication

5. **PATCH /users/:id/role:**

- ✅ Update user role (admin only)
- ✅ Return 403 for non-admin users
- ✅ Return 404 for non-existent user
- ✅ Require authentication

**Setup:**

- Create test users (admin and regular)
- Test role-based access control

## 2.6 End-to-End Tests

### 2.6.1 Authentication Flow E2E Tests

**File to create:** `test/e2e/auth.e2e-spec.ts`**Test scenarios:**

1. **Complete Registration Flow:**

- Register → Receive verification email → Verify email → Login

2. **Login Flow:**

- Login with verified account → Receive tokens → Use access token

3. **Token Refresh Flow:**

- Login → Use access token → Refresh tokens → Use new access token

4. **Logout Flow:**

- Login → Logout → Attempt to use refresh token (should fail)

5. **Logout All Flow:**

- Login from multiple devices → Logout all → All tokens revoked

**Key features:**

- Test complete user journeys
- Test cookie handling
- Test token expiration
- Test concurrent requests

### 2.6.2 Transaction Management Flow E2E Tests

**File to create:** `test/e2e/transactions.e2e-spec.ts`**Test scenarios:**

1. **Create Transaction Flow:**

- Create category → Create transaction → Verify transaction

2. **Transaction Filtering Flow:**

- Create multiple transactions → Filter by date → Filter by category → Verify results

3. **Transaction Statistics Flow:**

- Create income and expense transactions → Get statistics → Verify calculations

4. **Update and Delete Flow:**

- Create transaction → Update transaction → Delete transaction → Verify deletion

**Key features:**

- Test complete workflows
- Test data relationships
- Test statistics accuracy

### 2.6.3 Category Management Flow E2E Tests

**File to create:** `test/e2e/categories.e2e-spec.ts`**Test scenarios:**

1. **Category Hierarchy Flow:**

- Create parent category → Create subcategory → Verify hierarchy → Update parent → Verify changes

2. **Category with Transactions Flow:**

- Create category → Create transactions → Attempt to delete category (should fail) → Delete transactions → Delete category

3. **Category Type Validation Flow:**

- Create income category → Attempt to use for expense (should fail) → Create expense category → Use for expense

**Key features:**

- Test category relationships
- Test validation rules
- Test business constraints

## 2.7 Test Coverage and Reporting

### 2.7.1 Coverage Configuration

**File to modify:** `package.json` (jest.coverageThreshold)**Targets:**

- Global: 70% coverage
- Services: 80% coverage
- Repositories: 75% coverage
- Controllers: 70% coverage

### 2.7.2 Coverage Reports

**Generate reports:**

- HTML coverage report: `coverage/index.html`
- LCOV report for CI/CD
- Text summary in console

### 2.7.3 CI/CD Integration

**Add to CI pipeline:**

- Run all tests
- Generate coverage report
- Fail if coverage below threshold
- Upload coverage to service (Codecov, Coveralls)

## Implementation Order

1. **Week 1: Infrastructure Setup**

- Setup test database
- Create test helpers and factories
- Configure Jest

2. **Week 2: Unit Tests - Services**

- AuthService
- CategoriesService
- TransactionsService
- UsersService
- EmailService

3. **Week 3: Unit Tests - Repositories & Utilities**

- All repositories
- Utility functions
- Guards
- Filters
- Interceptors

4. **Week 4: Integration Tests**

- Auth controller
- Categories controller
- Transactions controller
- Users controller

5. **Week 5: E2E Tests**

- Authentication flows
- Transaction management flows
- Category management flows

6. **Week 6: Coverage & Polish**

- Achieve coverage targets
- Fix failing tests
- Document test patterns
- Setup CI/CD integration

## Success Criteria

- ✅ All services have minimum 80% code coverage
- ✅ All repositories have minimum 75% code coverage
