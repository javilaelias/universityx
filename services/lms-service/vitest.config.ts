import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: {
    globals:     true,
    environment: 'node',
    env: {
      NODE_ENV:        'test',
      DATABASE_URL:    'postgresql://test:test@localhost:5432/test_db',
      REDIS_URL:       'redis://:test@localhost:6379',
      JWT_SECRET:      'test-jwt-secret-that-is-long-enough-here-ok',
      ALLOWED_ORIGINS: 'http://localhost:3000',
      CDN_BASE_URL:    'http://localhost:9000',
      CACHE_TTL_SEC:   '300',
    },
  },
});
