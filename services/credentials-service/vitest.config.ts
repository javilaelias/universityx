import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: { postcss: { plugins: [] } },
  test: {
    globals:     true,
    environment: 'node',
    env: {
      NODE_ENV:     'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test_db',
      JWT_SECRET:   'test-jwt-secret-that-is-long-enough-here-ok',
      ISSUER_URL:   'http://localhost:4007',
      ISSUER_NAME:  'Universidad X (Test)',
    },
  },
});
