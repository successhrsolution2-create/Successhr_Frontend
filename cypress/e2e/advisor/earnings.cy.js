describe('business advisor earnings', () => {
  it('opens earnings as a business advisor', () => {
    cy.login('ba')
    cy.visit('/ba/earnings')
    cy.contains(/earning|commission/i, { timeout: 15000 }).should('be.visible')
  })
})
