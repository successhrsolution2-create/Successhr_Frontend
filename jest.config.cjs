module.exports = {
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/candidate/main.jsx',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage/jest',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png|jpg|jpeg|webp)$': '<rootDir>/test/__mocks__/fileMock.cjs'
  },
  setupFiles: ['<rootDir>/test/polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],
  testEnvironment: 'jsdom',
  testMatch: [
    '<rootDir>/src/**/*.{test,spec}.{js,jsx}',
    '<rootDir>/test/**/*.{test,spec}.{js,jsx}'
  ],
  testPathIgnorePatterns: ['/node_modules/', '/cypress/', '/dist/'],
  transform: {
    '^.+\\.(js|jsx|mjs)$': 'babel-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@bundled-es-modules|@mswjs|@open-draft|msw|rettime|until-async)/)'
  ]
}
