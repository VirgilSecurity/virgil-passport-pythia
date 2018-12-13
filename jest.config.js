const { join } = require('path');

module.exports = {
  preset: 'ts-jest',
  setupTestFrameworkScriptFile: join(__dirname, 'jest.setup.js'),
  testEnvironment: 'node',
};
