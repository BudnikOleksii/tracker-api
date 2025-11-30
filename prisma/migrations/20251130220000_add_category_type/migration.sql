ALTER TABLE "Category" ADD COLUMN "type" "TransactionType" NOT NULL DEFAULT 'EXPENSE';

DROP INDEX IF EXISTS "Category_userId_name_parentCategoryId_key";

CREATE UNIQUE INDEX "Category_userId_name_type_parentCategoryId_key" ON "Category"("userId", "name", "type", "parentCategoryId");

CREATE INDEX IF NOT EXISTS "Category_type_idx" ON "Category"("type");

