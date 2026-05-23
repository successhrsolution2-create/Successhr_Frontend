describe('EMS attendance check-in with mocked location', () => {
  it('checks in when inside office and disables repeat check-in', () => {
    cy.login('admin')
    cy.visit('/ems/attendance')
    cy.mockGeolocation({ latitude: 19.9975, longitude: 73.7898 })
    cy.contains(/office|attendance/i, { timeout: 15000 }).should('be.visible')
    cy.contains('button', /check in/i).click()
    cy.contains(/success|checked in/i, { timeout: 15000 }).should('be.visible')
    cy.contains('button', /already checked in|check in/i).should('be.disabled')
  })

  it('shows outside-office messaging when geolocation is outside the office', () => {
    cy.login('admin')
    cy.visit('/ems/attendance')
    cy.mockGeolocation({ latitude: 20.2, longitude: 74.2 })
    cy.contains(/outside|not at|distance/i, { timeout: 15000 }).should('be.visible')
  })
})
