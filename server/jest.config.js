module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFiles: ['<rootDir>/src/tests/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts', '!src/tests/**', '!src/db/seed.ts'],
  // Proposal objective 11: at least 80% line coverage. Branch floor is lower because the
  // PostgreSQL-only paths in database.ts are not exercised by the SQLite test run.
  coverageThreshold: {
    global: { lines: 80, statements: 80, functions: 80, branches: 60 },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { isolatedModules: true, tsconfig: { esModuleInterop: true } }]
  }
};
