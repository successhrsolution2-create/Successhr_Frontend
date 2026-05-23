describe('EMS employees', () => {
  it('opens employees list and add employee form', () => {
    cy.login('admin')
    cy.visit('/ems/employees')
    cy.contains(/employee/i, { timeout: 15000 }).should('be.visible')
    cy.contains(/add employee|new employee/i).click()
    cy.location('pathname').should('include', '/ems/employees/add')
  })
})
