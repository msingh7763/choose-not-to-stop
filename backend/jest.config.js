export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  moduleFileExtensions: ['js', 'json'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'controllers/**/*.js',
    'middleware/**/*.js',
    '!**/node_modules/**',
  ],
};
