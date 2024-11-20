import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['**/*.spec.ts'],
    globalSetup: './tests/setup.ts',
  },
})