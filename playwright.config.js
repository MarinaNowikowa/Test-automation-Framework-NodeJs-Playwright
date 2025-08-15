const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: [
    ['line'],
    ['allure-playwright', {
      detail: true,
      outputFolder: 'allure-results',
      suiteTitle: true,
      environmentInfo: {
        'API_URL': 'https://jsonplaceholder.typicode.com',
        'Framework': 'Playwright + Node.js',
        'Test_Type': 'API Testing'
      }
    }],
    ...(process.env.CI ? [['junit', { outputFile: 'test-results/junit.xml' }]] : [])
  ],
  use: {
    baseURL: 'https://jsonplaceholder.typicode.com',
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  },
  projects: [
    {
      name: 'api-tests',
      testDir: './tests/api',
    },
  ],
  timeout: 30000,
  expect: {
    timeout: 10000
  }
});
 