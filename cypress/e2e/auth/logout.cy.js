describe('auth - logout', () => {
  it('clears the session and returns to login', () => {
    cy.login('admin')
    cy.visit('/admin/dashboard')
    cy.logout()
    cy.visit('/')
    cy.location('pathname', { timeout: 15000 }).should('eq', '/login')
  })
})
