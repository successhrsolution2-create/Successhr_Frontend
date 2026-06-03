import { calcEarning } from './earningPreview'

describe('calcEarning', () => {
  it('calculates rounded placement earnings from salary, basis, and percent', () => {
    expect(calcEarning(50000, 1, 8.5)).toBe(4250)
  })

  it('returns 0 for non-numeric inputs', () => {
    expect(calcEarning('not-a-number', 1, 10)).toBe(0)
  })
})
