describe('business advisors', () => {
  it('opens advisor management as super admin', () => {
    cy.login('admin')
    cy.visit('/admin/business-advisors')
    cy.contains(/business advisor|advisor/i, { timeout: 15000 }).should('be.visible')
    cy.injectAxe()
    cy.checkA11y(null, null, null, true)
  })
})
