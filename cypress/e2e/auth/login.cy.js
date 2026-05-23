describe('auth - login and protected routes', () => {
  it('logs in, survives refresh, allows protected route, and redirects after storage is cleared', () => {
    cy.visit('/login')
    cy.fixture('testData').then(() => {
      cy.findByLabelText('email').type(Cypress.env('adminEmail'))
      cy.findByLabelText('password').type(Cypress.env('adminPassword'), { log: false })
    })
    cy.contains('button', /login/i).click()
    cy.location('pathname', { timeout: 15000 }).should('not.eq', '/login')

    cy.reload()
    cy.location('pathname').should('not.eq', '/login')

    cy.visit('/admin/dashboard')
    cy.location('pathname').should('eq', '/admin/dashboard')

    cy.clearLocalStorage()
    cy.clearCookies()
    cy.visit('/')
    cy.location('pathname', { timeout: 15000 }).should('eq', '/login')
  })

  it('shows UI validation errors for empty and invalid login inputs', () => {
    cy.visit('/login')
    cy.contains('button', /login/i).click()
    cy.contains(/enter a valid email/i).should('be.visible')
    cy.contains(/password is required/i).should('be.visible')

    cy.findByLabelText('email').type('not-an-email')
    cy.contains(/enter a valid email/i).should('be.visible')
    cy.findByLabelText('email').clear().type(Cypress.env('adminEmail'))
    cy.contains(/enter a valid email/i).should('not.exist')
  })
})
