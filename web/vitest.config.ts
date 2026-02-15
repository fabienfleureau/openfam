import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: 'verbose',
      exclude: [
        'node_modules/**',
        'src/domain/**',
        'src/infrastructure/**',
        'src/application/**',
        '**/*.spec.ts',
        '**/*.config.ts',
        'lib/migrations.ts'
      ]
    }
  }
})
