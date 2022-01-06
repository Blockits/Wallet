module.exports = {
  collectCoverageFrom: [
    '<rootDir>/src/scripts/controllers/permission/*.js',
    '<rootDir>/src/shared/**/*.js',
    '<rootDir>/src/pages/**/{*.js,*.jsx,*.ts,*.tsx}',
    '!<rootDir>/node_modules/**',
    '!<rootDir>/build/**',
  ],
  coverageDirectory: './jest-coverage/main',
  coveragePathIgnorePatterns: ['.snap', 'node_modules', 'build'],
  coverageReporters: ['html', 'text-summary', 'json'],
  coverageThreshold: {
    global: {
      branches: 35,
      function: 37,
      lines: 43,
      statements: 43,
    },
    './src/scripts/controllers/permission/*.js': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
  // TODO: enable resetMocks
  // resetMocks: true
  restoreMocks: true,
  setupFiles: ['<rootDir>/src/test/setup.js', '<rootDir>/src/test/env.js'],
  setupFilesAfterEnv: ['<rootDir>/src/test/jest/setup.js'],
  testMatch: [
    '<rootDir>/src/shared/**.*.test.js',
    '<rootDir>/src/scripts/lib/**.*.test.js',
    '<rootDir>/src/scripts/migrations/*.test.js',
    '<rootDir>/src/scripts/platforms/*.test.js',
    '<rootDir>/src/scripts/controllers/network/**/*.test.js',
    '<rootDir>/src/scripts/controllers/permission/*.test.js',
  ],
  testTimeout: 2500,
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
};
