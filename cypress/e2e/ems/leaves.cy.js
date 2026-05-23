describe('EMS leave application and approval flow', () => {
  it('applies for leave and approves it from pending list', () => {
    cy.login('admin')
    cy.fixture('testData').then(({ leave }) => {
      cy.visit('/ems/leaves/apply')
      cy.contains(/leave/i, { timeout: 15000 }).should('be.visible')
      cy.findByLabelText('type').select(leave.type)
      cy.findByLabelText('start|from').clear().type(leave.fromDate)
      cy.findByLabelText('end|to').clear().type(leave.toDate)
      cy.findByLabelText('reason').clear().type(leave.reason)
      cy.contains('button', /apply|submit/i).click()
      cy.contains(/pending/i, { timeout: 15000 }).should('be.visible')

      cy.visit('/ems/leaves/pending')
      cy.contains(leave.reason, { timeout: 15000 }).should('be.visible')
      cy.contains('button', /approve/i).click()
      cy.contains(/approved/i, { timeout: 15000 }).should('be.visible')
    })
  })
})
