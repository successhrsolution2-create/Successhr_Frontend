import { render } from '@testing-library/react'
import axe from 'axe-core'
import { axeAuditOptions } from './axe.config'

describe('accessibility smoke audit', () => {
  it('passes the configured axe rules for a basic app landmark', async () => {
    render(
      <main>
        <h1>Success Dashboard</h1>
        <button type="button">Save</button>
      </main>
    )

    const results = await axe.run(document.body, axeAuditOptions)

    expect(results.violations).toEqual([])
  })
})
