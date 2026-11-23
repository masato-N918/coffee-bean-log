import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildBeansQuery, fetchBean } from '../beans'
import { NotFoundError } from '../errors'

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

describe('fetchBean', () => {
  afterEach(() => vi.unstubAllGlobals())

  function stubFetch(ok: boolean, status: number, body?: unknown) {
    const fetchMock = vi
      .fn<(url: string) => Promise<unknown>>()
      .mockResolvedValue({ ok, status, json: () => Promise.resolve(body) })
    vi.stubGlobal('fetch', fetchMock)
    return fetchMock
  }

  it('豆を1件取得する', async () => {
    const fetchMock = stubFetch(true, 200, { id: 3, name: '豆' })
    await expect(fetchBean(3)).resolves.toEqual({ id: 3, name: '豆' })
    expect(fetchMock).toHaveBeenCalledWith('/api/beans/3')
  })

  it('404 のときは NotFoundError を投げる', async () => {
    stubFetch(false, 404)
    await expect(fetchBean(99)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('それ以外のエラーはステータス付きのメッセージで投げる', async () => {
    stubFetch(false, 500)
    await expect(fetchBean(1)).rejects.toThrow('豆の情報を取得できませんでした（500）')
  })
})
