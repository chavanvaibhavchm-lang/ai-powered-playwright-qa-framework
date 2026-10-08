import { defineConfig } from 'allure';
export default defineConfig({
  name: 'SauceDemo QA + Companion API',
  output: 'allure-report',
  historyPath: 'test-history/allure-history.jsonl',
  appendHistory: process.env.ALLURE_APPEND_HISTORY !== '0',
  historyLimit: 20,
  plugins: {
    awesome: {
      options: {
        reportName: 'SauceDemo QA + Companion API',
        reportLanguage: 'en',
        groupBy: ['epic', 'feature', 'story'],
      },
    },
  },
});
