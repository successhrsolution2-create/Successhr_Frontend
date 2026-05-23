describe('CRM call logs', () => {
  it('opens the CRM candidate area for call-log workflows', () => {
    cy.login('admin')
    cy.visit('/admin/crm/candidates')
    cy.contains(/candidate|crm/i).should('be.visible')
    cy.injectAxe()
    cy.checkA11y(null, null, null, true)
  })
})
