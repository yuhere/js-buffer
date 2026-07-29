import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts'],

    coverage: {
      provider: 'istanbul',
      reporter: ['json', 'text', 'html'],
      include: ['src/**/*.ts'],
      reportsDirectory: 'coverage/node',
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },

    pool: 'forks',
    singleFork: true,
  },
});
