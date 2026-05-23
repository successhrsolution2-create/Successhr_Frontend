describe('CRM candidates - add candidate and log call', () => {
  it('adds a candidate, opens profile, and records a call log', () => {
    cy.login('admin')
    cy.fixture('testData').then(({ candidate }) => {
      cy.visit('/admin/crm/candidates')
      cy.contains(/add candidate|new candidate/i).click()

      cy.findByLabelText('name').clear().type(candidate.name)
      cy.findByLabelText('phone|mobile').clear().type(candidate.phone)
      cy.findByLabelText('education').clear().type(candidate.education)
      cy.findByLabelText('job').first().clear().type(candidate.jobNo)
      cy.contains('button', /save|submit|add/i).click()

      cy.contains(candidate.name, { timeout: 15000 }).should('be.visible').click()
      cy.location('pathname').should('match', /candidates|crm/)
      cy.get(`a[href="tel:${candidate.phone}"], a[href^="tel:"]`).should('exist')

      cy.contains(/call log|log call|add call/i).click()
      cy.contains('label', /outcome|status/i).find('select,input').first().then(($field) => {
        if ($field.is('select')) cy.wrap($field).select('connected')
        else cy.wrap($field).clear().type('connected')
      })
      cy.findByLabelText('notes|remark').clear().type(candidate.remark)
      cy.contains('button', /save|submit|log/i).click()

      cy.contains(candidate.remark, { timeout: 15000 }).should('be.visible')
      cy.contains(/call count/i).parent().should('contain.text', '1')
    })
  })

  it('validates required candidate fields on the client', () => {
    cy.login('admin')
    cy.visit('/admin/crm/candidates')
    cy.contains(/add candidate|new candidate/i).click()
    cy.contains('button', /save|submit|add/i).click()
    cy.contains(/phone|mobile.*required|required.*phone|mobile/i).should('be.visible')
  })
})
