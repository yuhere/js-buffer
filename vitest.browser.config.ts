import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.spec.ts'],

    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: 'chromium',
          headless: false,
        },
      ],
    },

    coverage: {
      provider: 'istanbul',
      reporter: ['json', 'text', 'html'],
      include: ['src/**/*.ts'],
      reportsDirectory: 'coverage/browser',
    },
  },
});
