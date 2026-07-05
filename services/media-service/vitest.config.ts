import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: {
    globals:     true,
    environment: 'node',
    env: {
      NODE_ENV:           'test',
      DATABASE_URL:       'postgresql://test:test@localhost:5432/test_db',
      REDIS_URL:          'redis://localhost:6379',
      JWT_SECRET:         'test-jwt-secret-that-is-long-enough-here-ok',
      MEDIA_STORAGE_PATH: './.test-media',
      MEDIA_EXTERNAL_URL: 'http://localhost:4008',
    },
  },
});
