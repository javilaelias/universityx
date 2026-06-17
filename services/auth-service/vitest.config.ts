import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Provide empty PostCSS config to prevent postcss-load-config from scanning
  // package.json (which has a UTF-8 BOM on Windows and causes a JSON parse error)
  css: { postcss: { plugins: [] } },
  test: {
    globals:     true,
    environment: 'node',
    env: {
      NODE_ENV:              'test',
      DATABASE_URL:          'postgresql://test:test@localhost:5432/test_db',
      REDIS_URL:             'redis://:test@localhost:6379',
      JWT_SECRET:            'test-jwt-secret-that-is-long-enough-here-ok',
      JWT_REFRESH_SECRET:    'test-refresh-secret-that-is-long-enough-here',
      JWT_EXPIRES_IN:        '15m',
      JWT_REFRESH_EXPIRES_IN:'7d',
      ALLOWED_ORIGINS:       'http://localhost:3000',
    },
  },
});
