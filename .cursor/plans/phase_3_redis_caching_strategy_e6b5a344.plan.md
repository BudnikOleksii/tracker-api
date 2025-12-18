---
name: Phase 3 Redis Caching Strategy
overview: Implement comprehensive Redis caching strategy for the tracker API, including Redis infrastructure setup, cache module configuration, service-level caching for categories/transactions/users, and optional session management enhancements.
todos:
  - id: redis-docker
    content: Add Redis service to docker-compose.yml with persistent volume, health checks, and optional Redis Commander for development
    status: pending
  - id: install-cache-deps
    content: 'Install cache dependencies: @nestjs/cache-manager, cache-manager, cache-manager-redis-yet (or cache-manager-redis-store), and redis'
    status: pending
  - id: cache-config
    content: 'Create cache configuration files: cache.config.ts and cache.config.factory.ts with Redis connection settings, TTL, and key prefix configuration'
    status: pending
  - id: cache-module
    content: Create cache module (cache.module.ts) and cache service (cache.service.ts) with Redis store integration, error handling, and global registration
    status: pending
  - id: cache-utils
    content: 'Create cache utility files: cache-key.util.ts for key generation and cache-invalidation.util.ts for invalidation helpers'
    status: pending
  - id: cache-categories
    content: 'Implement caching in categories service: cache findAll() and findOne() with 1-hour TTL, implement cache invalidation on create/update/delete'
    status: pending
  - id: cache-transactions
    content: 'Implement caching in transactions service: cache getStatistics() with 5-minute TTL and query parameter hashing, invalidate on transaction mutations'
    status: pending
  - id: cache-users
    content: 'Implement caching in users service: cache findById() with 15-minute TTL, invalidate on profile/role updates'
    status: pending
  - id: cache-error-handling
    content: Add comprehensive error handling for cache operations with fallback to database queries and graceful degradation
    status: pending
  - id: cache-tests
    content: Create unit tests for cache service and integration tests with Redis test container
    status: pending
---

# Phase 3: Caching Strategy with Redis

## Overview

This phase implements a comprehensive Redis caching layer to improve API performance by reducing database load and response times. The implementation includes Redis infrastructure setup, cache module configuration, service-level caching strategies, and optional session management enhancements.

## Architecture

The caching strategy follows a layered approach:

```javascript
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │Categories│  │Transactions│ │  Users  │             │
│  │ Service  │  │  Service   │ │ Service │             │
│  └────┬─────┘  └─────┬──────┘ └────┬─────┘             │
│       │              │              │                   │
│       └──────────────┼──────────────┘                   │
│                      │                                  │
│              ┌───────▼────────┐                        │
│              │  Cache Service  │                        │
│              │   (Wrapper)     │                        │
│              └───────┬─────────┘                        │
└──────────────────────┼──────────────────────────────────┘
                       │
              ┌────────▼─────────┐
              │  Cache Module     │
              │  (NestJS Cache)   │
              └────────┬──────────┘
                       │
              ┌────────▼─────────┐
              │  Redis Store     │
              │  (cache-manager) │
              └────────┬──────────┘
                       │
              ┌────────▼─────────┐
              │  Redis Server    │
              │  (Docker)        │
              └──────────────────┘
```

## Implementation Steps

### 3.1 Add Redis to Docker Compose

**File to modify:** `docker-compose.yml`**Changes:**

- Add Redis service with persistent volume
- Configure Redis with appropriate settings
- Add Redis to the existing network
- Optionally add Redis Commander for development debugging

**Configuration details:**

- Use `redis:7-alpine` image for smaller footprint
- Configure persistent volume for data persistence
- Set memory limits and eviction policies
- Expose Redis port (default 6379) for local development
- Add health check configuration

**Redis service configuration:**

```yaml
redis:
  image: redis:7-alpine
  container_name: tracker-redis
  restart: unless-stopped
  ports:
    - '6379:6379'
  volumes:
    - redis_data:/data
  command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
  networks:
    - tracker-network
  healthcheck:
    test: ['CMD', 'redis-cli', 'ping']
    interval: 10s
    timeout: 3s
    retries: 3
```

**Optional Redis Commander (development only):**

```yaml
redis-commander:
  image: rediscommander/redis-commander:latest
  container_name: tracker-redis-commander
  restart: unless-stopped
  environment:
    REDIS_HOSTS: local:redis:6379
  ports:
    - '8081:8081'
  networks:
    - tracker-network
  depends_on:
    - redis
```

### 3.2 Install Dependencies

**File to modify:** `package.json`**Dependencies to add:**

- `@nestjs/cache-manager` - NestJS cache abstraction
- `cache-manager` - Cache manager library
- `cache-manager-redis-store` - Redis store adapter (or use `cache-manager-redis-yet` for newer Redis client)
- `redis` - Redis client (if using newer adapter)

**Note:** For NestJS 11.x, prefer `cache-manager-redis-yet` which uses the modern `redis` package instead of the deprecated `cache-manager-redis-store`.

### 3.3 Create Cache Configuration

**Files to create:**

- `src/config/cache.config.ts` - Cache configuration interface and schema
- `src/config/cache.config.factory.ts` - Cache configuration factory

**Configuration schema:**

- `host` - Redis host (default: localhost)
- `port` - Redis port (default: 6379)
- `password` - Redis password (optional)
- `db` - Redis database number (default: 0)
- `ttl` - Default TTL in seconds (default: 3600)
- `max` - Maximum number of items in cache (optional)
- `keyPrefix` - Prefix for all cache keys (default: 'tracker:')

**Environment variables:**

- `REDIS_HOST` - Redis server host
- `REDIS_PORT` - Redis server port
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number
- `CACHE_TTL` - Default cache TTL in seconds
- `CACHE_KEY_PREFIX` - Cache key prefix

**File structure:**

```typescript
// cache.config.ts
export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  ttl: number;
  max?: number;
  keyPrefix: string;
}
```

### 3.4 Create Cache Module

**Files to create:**

- `src/cache/cache.module.ts` - Cache module definition
- `src/cache/cache.service.ts` - Cache service wrapper

**Cache Module responsibilities:**

- Register CacheModule with Redis store
- Configure Redis connection using cache config
- Export CacheService globally for use across modules
- Handle Redis connection errors gracefully

**Cache Service wrapper:**

- Provide typed cache operations
- Implement cache key generation utilities
- Add cache invalidation helpers
- Support both decorator-based and manual caching

**Key features:**

- Type-safe cache operations
- Automatic key prefixing
- Cache invalidation patterns (wildcard support)
- Error handling and fallback mechanisms

**File to modify:** `src/config/config.module.ts`

- Import cache config factory
- Add cache config to ConfigModule load array

**File to modify:** `src/app.module.ts`

- Import CacheModule
- Register CacheModule globally

### 3.5 Implement Caching in Categories Service

**File to modify:** `src/categories/categories.service.ts`**Caching strategy:**

1. **Cache all categories list:**

- Cache key: `categories:all:{userId}:{type?}`
- TTL: 1 hour (3600 seconds)
- Invalidate on: create, update, delete

2. **Cache category by ID:**

- Cache key: `categories:id:{categoryId}`
- TTL: 1 hour (3600 seconds)
- Invalidate on: update, delete

3. **Cache invalidation:**

- On create: Invalidate user's category list cache
- On update: Invalidate category by ID and user's list cache
- On delete: Invalidate category by ID and user's list cache

**Implementation approach:**

- Inject CacheService
- Use manual cache management (not decorators) for better control
- Implement cache-aside pattern
- Add try-catch for cache operations to handle Redis failures gracefully

**Methods to modify:**

- `findAll()` - Add cache check before repository call
- `findOne()` - Add cache check before repository call
- `create()` - Invalidate cache after creation
- `update()` - Invalidate cache after update
- `remove()` - Invalidate cache after deletion

### 3.6 Implement Caching in Transactions Service

**File to modify:** `src/transactions/transactions.service.ts`**Caching strategy:**

1. **Cache transaction statistics:**

- Cache key: `transactions:stats:{userId}:{hash(queryParams)}`
- TTL: 5 minutes (300 seconds)
- Include query parameters in cache key hash
- Invalidate on: create, update, delete (for affected user)

2. **Cache transaction lists (optional, with careful consideration):**

- Generally avoid caching paginated lists due to high variability
- Consider caching only for frequently accessed, stable queries

**Implementation approach:**

- Cache only statistics endpoint (`getStatistics()`)
- Use query parameter hash for cache key generation
- Implement cache invalidation on transaction mutations
- Consider cache warming for common statistics queries

**Methods to modify:**

- `getStatistics()` - Add cache check and store
- `create()` - Invalidate user's statistics cache
- `update()` - Invalidate user's statistics cache
- `remove()` - Invalidate user's statistics cache

**Cache key generation:**

- Create utility function to hash query parameters
- Include: userId, type, currencyCode, dateFrom, dateTo, groupBy
- Use deterministic hashing (e.g., sorted JSON string + hash)

### 3.7 Implement Caching in Users Service

**File to modify:** `src/users/users.service.ts`**Caching strategy:**

1. **Cache user profile:**

- Cache key: `users:profile:{userId}`
- TTL: 15 minutes (900 seconds)
- Invalidate on: update

2. **Cache user by email (optional):**

- Cache key: `users:email:{email}`
- TTL: 15 minutes (900 seconds)
- Use with caution due to email uniqueness

**Implementation approach:**

- Cache user profile lookups
- Invalidate cache on profile updates
- Consider not caching email lookups (used primarily for auth)

**Methods to modify:**

- `findById()` - Add cache check and store
- `updateProfile()` - Invalidate cache after update
- `updateRole()` - Invalidate cache after update

### 3.8 Optional: Redis for Session Management

**Files to modify:**

- `src/auth/auth.service.ts`
- `src/auth/repositories/refresh-tokens.repository.ts`

**Enhancement options:**

1. **Refresh token storage in Redis:**

- Move refresh tokens from PostgreSQL to Redis
- Benefits: Faster lookups, automatic expiration
- Store token metadata (userId, deviceInfo, ipAddress, expiresAt)
- Keep PostgreSQL for audit trail (optional)

2. **Session invalidation optimization:**

- Use Redis for logout-all operations
- Store active session list per user
- Faster invalidation compared to database updates

3. **Rate limiting storage:**

- If using distributed rate limiting, store counters in Redis
- Already handled by @nestjs/throttler if configured with Redis

**Implementation considerations:**

- This is an optional enhancement
- Maintain backward compatibility with existing refresh token system
- Consider hybrid approach: Redis for active tokens, DB for audit

### 3.9 Cache Utilities and Helpers

**Files to create:**

- `src/cache/utils/cache-key.util.ts` - Cache key generation utilities
- `src/cache/utils/cache-invalidation.util.ts` - Cache invalidation helpers

**Cache key utilities:**

- Standardized key generation functions
- Key prefix management
- Parameter hashing for complex keys

**Cache invalidation utilities:**

- Pattern-based invalidation (wildcard support)
- Batch invalidation helpers
- Invalidation on entity relationships

### 3.10 Error Handling and Fallback

**Implementation considerations:**

- Wrap all cache operations in try-catch
- Fallback to database on cache failures
- Log cache errors without breaking application flow
- Consider circuit breaker pattern for Redis failures

**Error handling strategy:**

- Cache misses: Normal flow, fetch from database
- Cache errors: Log error, continue with database query
- Redis connection failures: Graceful degradation

### 3.11 Testing Considerations

**Test setup:**

- Use Redis test container for integration tests
- Mock CacheService for unit tests
- Test cache hit/miss scenarios
- Test cache invalidation logic
- Test error handling and fallback

**Test files to create:**

- `src/cache/cache.service.spec.ts` - Unit tests for cache service
- `test/integration/cache.integration.spec.ts` - Integration tests with Redis

### 3.12 Documentation and Configuration

**Documentation updates:**

- Add Redis setup instructions to README
- Document cache TTL values and strategies
- Document cache key patterns
- Add environment variable documentation

**Configuration validation:**

- Validate Redis connection on application startup
- Log cache configuration on startup
- Add health check for Redis connectivity

## Cache Key Patterns

Standard cache key patterns to use:

- Categories: `categories:all:{userId}:{type?}`, `categories:id:{categoryId}`
- Transactions: `transactions:stats:{userId}:{queryHash}`
- Users: `users:profile:{userId}`, `users:email:{email}`

## TTL Strategy

- Categories: 1 hour (relatively stable data)
- Transaction statistics: 5 minutes (more dynamic)
- User profiles: 15 minutes (moderate update frequency)

## Cache Invalidation Strategy

- Immediate invalidation on mutations (create, update, delete)
- Pattern-based invalidation for related entities
- Consider cache warming for frequently accessed data

## Performance Considerations

- Use Redis pipelining for batch operations
- Monitor cache hit rates
- Adjust TTL values based on usage patterns
- Consider cache size limits and eviction policies
- Monitor Redis memory usage

## Security Considerations

- Secure Redis connection (password, TLS in production)
- Validate cache keys to prevent injection
- Set appropriate Redis ACLs in production
