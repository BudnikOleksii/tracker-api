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
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  VALIDATION_ERROR: 'Validation failed',
} as const;
