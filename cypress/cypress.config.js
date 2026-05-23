import { defineConfig } from 'cypress'

const defaultHost = 'localhost'

export default defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || `http://${defaultHost}:5173`,
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.js',
    fixturesFolder: 'cypress/fixtures',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1440,
    viewportHeight: 900,
    defaultCommandTimeout: 10000,
    env: {
      apiUrl: process.env.CYPRESS_API_URL || `http://${defaultHost}:5000`,
      adminEmail: process.env.CYPRESS_ADMIN_EMAIL,
      adminPassword: process.env.CYPRESS_ADMIN_PASSWORD,
      baEmail: process.env.CYPRESS_BA_EMAIL,
      baPassword: process.env.CYPRESS_BA_PASSWORD,
      candidateAdminEmail: process.env.CYPRESS_CANDIDATE_ADMIN_EMAIL,
      candidateAdminPassword: process.env.CYPRESS_CANDIDATE_ADMIN_PASSWORD,
      employeeEmail: process.env.CYPRESS_EMPLOYEE_EMAIL,
      employeePassword: process.env.CYPRESS_EMPLOYEE_PASSWORD
    }
  }
})
