import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 60000,
    hookTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    reporters: ['verbose'],
    sequence: {
      concurrent: false // Run tests sequentially (IntelScout uses Gemini API)
    }
  }
});
