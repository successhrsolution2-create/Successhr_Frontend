const apiUrl = () => Cypress.env('apiUrl') || 'http://localhost:5000'

const credentialsFor = (role = 'admin') => {
  const map = {
    admin: ['adminEmail', 'adminPassword'],
    superAdmin: ['adminEmail', 'adminPassword'],
    ba: ['baEmail', 'baPassword'],
    advisor: ['baEmail', 'baPassword'],
    candidateAdmin: ['candidateAdminEmail', 'candidateAdminPassword'],
    agent: ['candidateAdminEmail', 'candidateAdminPassword'],
    employee: ['employeeEmail', 'employeePassword']
  }
  const [emailKey, passwordKey] = map[role] || map.admin
  return {
    email: Cypress.env(emailKey),
    password: Cypress.env(passwordKey)
  }
}

const requireCredentials = (role) => {
  const credentials = credentialsFor(role)
  expect(credentials.email, `${role} email env`).to.be.a('string').and.not.be.empty
  expect(credentials.password, `${role} password env`).to.be.a('string').and.not.be.empty
  return credentials
}

Cypress.Commands.add('login', (role = 'admin') => {
  const credentials = requireCredentials(role)

  cy.request({
    method: 'POST',
    url: `${apiUrl()}/api/auth/login`,
    body: credentials,
    failOnStatusCode: false
  }).then((response) => {
    expect(response.status).to.eq(200)
    expect(response.body.user).to.exist
    window.localStorage.setItem('user', JSON.stringify(response.body.user))
  })
})

Cypress.Commands.add('logout', () => {
  cy.request({
    method: 'POST',
    url: `${apiUrl()}/api/auth/logout`,
    failOnStatusCode: false
  })
  cy.clearCookies()
  cy.clearLocalStorage()
})

Cypress.Commands.add('mockGeolocation', ({ latitude, longitude }) => {
  cy.window().then((win) => {
    cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
      success({
        coords: {
          latitude,
          longitude,
          accuracy: 10
        }
      })
    })
  })
})

Cypress.Commands.add('findByLabelText', (label) => {
  cy.contains('label', new RegExp(label, 'i')).find('input, textarea, select')
})
