import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useBeanListStore } from '../beanList'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('beanList ストア', () => {
  it('初期状態は条件なし・新しい順', () => {
    const store = useBeanListStore()
    expect(store.hasFilter).toBe(false)
    expect(store.query).toEqual({
      origin: undefined,
      roast_group: [],
      roast_level: [],
      min_rating: undefined,
      sort: 'newest',
    })
  })

  it('焙煎度の選択を呼び方と8段階に分けて API の条件にする', () => {
    const store = useBeanListStore()
    store.origin = ' ケニア '
    store.roasts = ['g:medium', 'l:city', 'l:french']
    store.minRating = 4
    expect(store.query).toEqual({
      origin: 'ケニア',
      roast_group: ['medium'],
      roast_level: ['city', 'french'],
      min_rating: 4,
      sort: 'newest',
    })
    expect(store.hasFilter).toBe(true)
  })

  it('並び順だけでは絞り込み条件ありにならない', () => {
    const store = useBeanListStore()
    store.sort = 'rating'
    expect(store.hasFilter).toBe(false)
  })

  it('clearFilters で絞り込み条件を解除し、並び順は残す', () => {
    const store = useBeanListStore()
    store.origin = 'ケニア'
    store.roasts = ['g:dark']
    store.minRating = 2
    store.sort = 'rating'
    store.clearFilters()
    expect(store.hasFilter).toBe(false)
    expect(store.sort).toBe('rating')
  })
})
