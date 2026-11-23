import { describe, expect, it } from 'vitest'

import { buildBeansQuery } from '../beans'

describe('buildBeansQuery', () => {
  it('条件がないときは空文字', () => {
    expect(buildBeansQuery()).toBe('')
  })

  it('焙煎度は同じキーを繰り返し、すべての条件を組み立てる', () => {
    const qs = buildBeansQuery({
      origin: ' エチオピア ',
      roast_group: ['light', 'dark'],
      roast_level: ['city'],
      min_rating: 3,
      sort: 'rating',
    })
    const params = new URLSearchParams(qs)
    expect(params.get('origin')).toBe('エチオピア')
    expect(params.getAll('roast_group')).toEqual(['light', 'dark'])
    expect(params.getAll('roast_level')).toEqual(['city'])
    expect(params.get('min_rating')).toBe('3')
    expect(params.get('sort')).toBe('rating')
  })

  it('空の条件は送らない', () => {
    expect(buildBeansQuery({ origin: '  ', roast_group: [], roast_level: [] })).toBe('')
  })
})
