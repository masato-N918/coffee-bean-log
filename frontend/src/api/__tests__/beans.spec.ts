import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildBeansQuery, createBean, deleteBean, fetchBean, updateBean } from '../beans'
import { NotFoundError } from '../errors'
import type { BeanInput } from '@/types/bean'

function stubFetch(ok: boolean, status: number, body?: unknown) {
  const fetchMock = vi
    .fn<(url: string, init?: RequestInit) => Promise<unknown>>()
    .mockResolvedValue({ ok, status, json: () => Promise.resolve(body) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

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

describe('createBean / updateBean / deleteBean', () => {
  afterEach(() => vi.unstubAllGlobals())

  const input: BeanInput = {
    name: '豆',
    shop: null,
    origin: null,
    roast_group: 'medium',
    roast_level: null,
    process: null,
    purchased_on: null,
    weight_g: 200,
    price: null,
    rating: null,
    memo: null,
  }

  it('createBean は POST で JSON を送り、登録した豆を返す', async () => {
    const fetchMock = stubFetch(true, 201, { id: 10, ...input })
    await expect(createBean(input)).resolves.toMatchObject({ id: 10 })
    const [url, init] = fetchMock.mock.lastCall!
    expect(url).toBe('/api/beans')
    expect(init?.method).toBe('POST')
    expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json')
    expect(JSON.parse(init?.body as string)).toEqual(input)
  })

  it('createBean が失敗したらステータス付きのメッセージで投げる', async () => {
    stubFetch(false, 422)
    await expect(createBean(input)).rejects.toThrow('豆を保存できませんでした（422）')
  })

  it('updateBean は PUT で送る。404 は NotFoundError', async () => {
    const fetchMock = stubFetch(true, 200, { id: 3, ...input })
    await updateBean(3, input)
    const [url, init] = fetchMock.mock.lastCall!
    expect(url).toBe('/api/beans/3')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init?.body as string)).toEqual(input)

    stubFetch(false, 404)
    await expect(updateBean(99, input)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('deleteBean は DELETE を送る。エラーはステータス付きで投げる', async () => {
    const fetchMock = stubFetch(true, 204)
    await expect(deleteBean(3)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/beans/3', { method: 'DELETE' })

    stubFetch(false, 404)
    await expect(deleteBean(99)).rejects.toBeInstanceOf(NotFoundError)
    stubFetch(false, 500)
    await expect(deleteBean(3)).rejects.toThrow('豆を削除できませんでした（500）')
  })
})
