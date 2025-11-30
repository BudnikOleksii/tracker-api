<!-- 93aa5eb6-126e-459a-be90-ed69c02fa4f9 0c4713b2-46ae-437c-9e27-d61cbf5ac5c1 -->
# Phase 1: Database Schema, Migrations, and Seeding

## Overview

Implement the complete database schema using Prisma, create initial migration, and build a seed script to import transaction data from the existing JSON file.

## Step 1: Create Prisma Schema

### 1.1 Define Enums

Create enums in `prisma/schema.prisma`:

- `UserRole`: USER, ADMIN, SUPER_ADMIN (default: USER)
- `TransactionType`: EXPENSE, INCOME
- `CountryCode`: All ISO 3166-1 alpha-2 country codes (e.g., US, UA, GB, DE, FR, etc.)
- `CurrencyCode`: All ISO 4217 currency codes (e.g., USD, EUR, GBP, UAH, JPY, etc.)

### 1.2 User Model

Create `User` model with:

- `id` (String @id @default(uuid()))
- `email` (String @unique)
- `passwordHash` (String)
- `emailVerified` (Boolean @default(false))
- `emailVerificationToken` (String?)
- `emailVerificationTokenExpiresAt` (DateTime?)
- `countryCode` (CountryCode?)
- `baseCurrencyCode` (CurrencyCode?)
- `ipAddress` (String?)
- `userAgent` (String?)
- `role` (UserRole @default(USER))
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)
- `deletedAt` (DateTime?)
- Relations: `refreshTokens`, `categories`, `transactions`

### 1.3 RefreshToken Model

Create `RefreshToken` model with:

- `id` (String @id @default(uuid()))
- `userId` (String, foreign key)
- `token` (String @unique)
- `deviceInfo` (String?)
- `ipAddress` (String?)
- `userAgent` (String?)
- `expiresAt` (DateTime)
- `replacedByTokenId` (String?)
- `revokedAt` (DateTime?)
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)
- Relations: `user`, `replacedByToken` (self-relation), `replacedToken`

### 1.4 Category Model

Create `Category` model with:

- `id` (String @id @default(uuid()))
- `userId` (String, foreign key)
- `name` (String)
- `parentCategoryId` (String?)
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)
- `deletedAt` (DateTime?)
- Relations: `user`, `parentCategory`, `subcategories`, `transactions`
- Unique constraint: `@@unique([userId, name, parentCategoryId])`

### 1.5 Transaction Model

Create `Transaction` model with:

- `id` (String @id @default(uuid()))
- `userId` (String, foreign key)
- `categoryId` (String, foreign key)
- `type` (TransactionType)
- `amount` (Decimal)
- `currencyCode` (CurrencyCode)
- `date` (DateTime)
- `description` (String?)
- `createdAt` (DateTime @default(now()))
- `updatedAt` (DateTime @updatedAt)
- `deletedAt` (DateTime?)
- Relations: `user`, `category`

### 1.6 Add Indexes

Add indexes for performance:

- User: `@@index([email])`
- RefreshToken: `@@index([token])`, `@@index([userId])`
- Category: `@@index([userId])`, `@@index([parentCategoryId])`
- Transaction: `@@index([userId])`, `@@index([categoryId])`, `@@index([date])`, `@@index([type])`, `@@index([currency])`

### 1.7 Enum Implementation Notes

- **CountryCode enum**: Include all ISO 3166-1 alpha-2 codes. Consider using a comprehensive list or generating from a standard source. Common codes: US, UA, GB, DE, FR, CA, AU, JP, CN, etc.
- **CurrencyCode enum**: Include all ISO 4217 currency codes. Common codes: USD, EUR, GBP, UAH, JPY, CAD, AUD, CHF, CNY, etc. Ensure UAH is included for seed data compatibility.

## Step 2: Generate Prisma Client and Create Migration

### 2.1 Generate Prisma Client

Run `pnpm prisma generate` to generate the Prisma client with the new schema.

### 2.2 Create Initial Migration

Run `pnpm prisma migrate dev --name init` to create the initial migration file in `prisma/migrations/`.

### 2.3 Verify Migration

Review the generated migration file to ensure all tables, indexes, and constraints are correctly created.

## Step 3: Create Seed Script

### 3.1 Create Seed Script Structure

Create `prisma/seeds/index.ts` with:

- Import PrismaClient
- Import transaction data from JSON file
- Type definitions for JSON transaction structure
- Main seed function

### 3.2 Seed Script Implementation

#### 3.2.1 Type Definitions

Define TypeScript interfaces:

- `TransactionJson`: Date, Category, Type, Amount, Currency, Subcategory?

#### 3.2.2 Helper Functions

Create utility functions:

- `parseDate(dateString: string)`: Parse "MM/DD/YYYY HH:mm:ss" format to Date
- `mapTransactionType(type: string)`: Map "Expense"/"Income" to TransactionType enum
- `normalizeCategoryName(name: string)`: Handle category name normalization if needed

#### 3.2.3 Main Seed Function

Implement `main()` function that:

1. Creates or finds a test user (email: "test@example.com", password: "Test123!@#")

   - Hash password using bcrypt (10 rounds)
   - Set emailVerified to true for seed user

2. Reads and parses `transactions-02.03.25.json`
3. Processes transactions:

   - Extract unique categories and subcategories
   - Create parent categories first (where Subcategory is null/undefined)
   - Create subcategories (where Subcategory exists, link to parent)
   - Maintain category map for transaction linking

4. Create transactions:

   - Link each transaction to appropriate category/subcategory
   - Parse dates from "MM/DD/YYYY HH:mm:ss" format
   - Map transaction types (Expense → EXPENSE, Income → INCOME)
   - Store amount as Decimal
   - Store currency as-is (ISO 4217 codes)

5. Handle errors gracefully with try-catch
6. Disconnect Prisma client on completion

#### 3.2.4 Category Creation Logic

- Group transactions by Category name
- For each unique Category:
  - Check if parent category exists for user
  - If not, create parent category
  - Store category ID in map
- For transactions with Subcategory:
  - Check if subcategory exists under parent for user
  - If not, create subcategory with parentCategoryId
  - Store subcategory ID in map

### 3.3 Add Seed Script to package.json

Add script: `"seed": "ts-node -r tsconfig-paths/register prisma/seeds/index.ts"`

### 3.4 Install Required Dependencies

Ensure `ts-node` and `bcrypt` are available (already in package.json).

## Step 4: Test and Validate

### 4.1 Run Migration

Execute `pnpm prisma migrate dev` to apply migration to database.

### 4.2 Run Seed Script

Execute `pnpm seed` to populate database with test data.

### 4.3 Validate Data

Verify:

- User is created correctly
- Categories and subcategories are created with proper parent-child relationships
- All transactions are imported and linked to correct categories
- Date parsing is correct
- Transaction types are mapped correctly
- Amounts are stored as Decimal
- No duplicate categories per user

### 4.4 Check Database

Use Prisma Studio (`pnpm prisma studio`) or direct database query to verify:

- Record counts match expected values
- Relationships are properly established
- Data integrity constraints are enforced

## File Structure After Implementation

```
prisma/
├── schema.prisma (complete with all models)
├── migrations/
│   └── [timestamp]_init/
│       └── migration.sql
└── seeds/
    ├── index.ts (seed script)
    └── data/
        └── transactions-02.03.25.json
```

## Key Considerations

- Use `@db.Uuid` for UUID fields if PostgreSQL requires explicit type
- Use `@db.Decimal(19, 4)` for amount field to ensure precision
- Ensure all foreign key relationships have proper `onDelete` and `onUpdate` cascade rules
- Use `@@map` for table names if different naming convention is needed
- Handle timezone considerations for DateTime fields
- Validate currency codes match ISO 4217 standard (store as-is, validation in application layer)
- Ensure unique constraint on Category prevents duplicate names per user (including null parentCategoryId)