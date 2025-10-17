import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'out/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.config.ts',
      ],
    },
    testTimeout: 10000,
  },
});
