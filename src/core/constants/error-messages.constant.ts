export const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  EMAIL_NOT_VERIFIED:
    'Email not verified. Please verify your email before logging in',
  INVALID_VERIFICATION_TOKEN: 'Invalid or expired verification token',
  INVALID_REFRESH_TOKEN: 'Invalid or expired refresh token',
  REFRESH_TOKEN_REVOKED: 'Refresh token has been revoked',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden: Insufficient permissions',
  CATEGORY_NOT_FOUND: 'Category not found',
  CATEGORY_ALREADY_EXISTS:
    'Category with this name already exists for this type and parent',
  CATEGORY_HAS_TRANSACTIONS:
    'Cannot delete category with associated transactions',
  CATEGORY_HAS_SUBCATEGORIES: 'Cannot delete category with subcategories',
  INVALID_PARENT_CATEGORY:
    'Parent category not found or does not belong to you',
  CIRCULAR_CATEGORY_REFERENCE:
    'Cannot set parent that would create a circular reference',
  PARENT_CATEGORY_TYPE_MISMATCH: 'Parent category type must match',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  VALIDATION_ERROR: 'Validation failed',
} as const;
