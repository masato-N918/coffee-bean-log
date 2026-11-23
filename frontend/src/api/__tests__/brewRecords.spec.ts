import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchBrewRecords } from '../brewRecords'
import { NotFoundError } from '../errors'

function stubFetch(ok: boolean, status: number, body?: unknown) {
  const fetchMock = vi
    .fn<(url: string) => Promise<unknown>>()
    .mockResolvedValue({ ok, status, json: () => Promise.resolve(body) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('fetchBrewRecords', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('豆の抽出記録の一覧を取得する', async () => {
    const fetchMock = stubFetch(true, 200, [{ id: 1 }])
    await expect(fetchBrewRecords(3)).resolves.toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith('/api/beans/3/brew-records')
  })

  it('404 のときは NotFoundError を投げる', async () => {
    stubFetch(false, 404)
    await expect(fetchBrewRecords(99)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('それ以外のエラーはステータス付きのメッセージで投げる', async () => {
    stubFetch(false, 500)
    await expect(fetchBrewRecords(1)).rejects.toThrow('抽出記録を取得できませんでした（500）')
  })
})
