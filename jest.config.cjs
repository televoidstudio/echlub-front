const config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    roots: ['<rootDir>/src'],
    testMatch: ['**/__tests__/**/*.test.ts'],
    setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            useESM: false
        }]
    },
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^@/(.*)$': '<rootDir>/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^src/(.*)$': '<rootDir>/src/$1'
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleDirectories: ['node_modules', 'src'],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 30,
            functions: 30,
            lines: 30,
            statements: 30
        }
    },
    collectCoverageFrom: [
        'src/modules/identity/**/*.{ts,tsx}',
        '!src/modules/identity/**/*.d.ts',
        '!src/modules/identity/**/*.stories.{ts,tsx}',
        '!src/modules/identity/**/*.test.{ts,tsx}',
        '!src/modules/identity/**/__tests__/**',
        '!src/modules/identity/**/__mocks__/**',
        'src/modules/collaboration/**/*.{ts,tsx}',
        '!src/modules/collaboration/**/*.d.ts',
        '!src/modules/collaboration/**/*.stories.{ts,tsx}',
        '!src/modules/collaboration/**/*.test.{ts,tsx}',
        '!src/modules/collaboration/**/__tests__/**',
        '!src/modules/collaboration/**/__mocks__/**',
    ],
    globals: {
        crypto: {
            randomUUID: () => 'test-uuid'
        }
    }
};

module.exports = config; 