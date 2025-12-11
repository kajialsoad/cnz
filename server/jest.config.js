module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.test.ts'],
    testTimeout: 30000, // 30 seconds for database operations
    collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!src/**/*.d.ts',
    ],
};
