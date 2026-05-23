describe('EMS payroll', () => {
  it('opens payroll generation flow', () => {
    cy.login('admin')
    cy.visit('/ems/payroll/generate')
    cy.contains(/payroll|salary/i, { timeout: 15000 }).should('be.visible')
  })
})
