import 'cypress-axe'
import './commands'

beforeEach(() => {
  cy.on('uncaught:exception', () => false)
})
