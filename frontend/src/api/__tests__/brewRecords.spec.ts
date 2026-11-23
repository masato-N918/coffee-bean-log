import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createBrewRecord,
  deleteBrewRecord,
  fetchBrewRecord,
  fetchBrewRecords,
  updateBrewRecord,
} from '../brewRecords'
import { NotFoundError } from '../errors'
import type { BrewRecordInput } from '@/types/brewRecord'

function stubFetch(ok: boolean, status: number, body?: unknown) {
  const fetchMock = vi
    .fn<(url: string, init?: RequestInit) => Promise<unknown>>()
    .mockResolvedValue({ ok, status, json: () => Promise.resolve(body) })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const input: BrewRecordInput = {
  brewed_on: '2026-11-23',
  method: 'machine',
  temperature: 'ice',
  dose_amount: 2,
  dose_unit: 'cup',
  water_amount: null,
  water_unit: null,
  equipment: null,
  grind_size: null,
  water_temp_c: null,
  brew_time_sec: null,
  taste_memo: null,
}

afterEach(() => vi.unstubAllGlobals())

describe('fetchBrewRecords', () => {
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

describe('fetchBrewRecord', () => {
  it('抽出記録を1件取得する', async () => {
    const fetchMock = stubFetch(true, 200, { id: 7 })
    await expect(fetchBrewRecord(7)).resolves.toEqual({ id: 7 })
    expect(fetchMock).toHaveBeenCalledWith('/api/brew-records/7')
  })

  it('404 のときは「抽出記録が見つかりません」の NotFoundError を投げる', async () => {
    stubFetch(false, 404)
    const p = fetchBrewRecord(99)
    await expect(p).rejects.toBeInstanceOf(NotFoundError)
    await expect(p).rejects.toThrow('抽出記録が見つかりません')
  })

  it('それ以外のエラーはステータス付きのメッセージで投げる', async () => {
    stubFetch(false, 500)
    await expect(fetchBrewRecord(1)).rejects.toThrow('抽出記録を取得できませんでした（500）')
  })
})

describe('createBrewRecord', () => {
  it('豆に紐づけて POST し、登録した記録を返す', async () => {
    const fetchMock = stubFetch(true, 201, { id: 10 })
    await expect(createBrewRecord(3, input)).resolves.toEqual({ id: 10 })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/beans/3/brew-records')
    expect(init?.method).toBe('POST')
    expect(init?.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init?.body as string)).toEqual(input)
  })

  it('豆が見つからない（404）ときは NotFoundError を投げる', async () => {
    stubFetch(false, 404)
    await expect(createBrewRecord(99, input)).rejects.toThrow('豆が見つかりません')
  })

  it('それ以外のエラーはステータス付きのメッセージで投げる', async () => {
    stubFetch(false, 422)
    await expect(createBrewRecord(3, input)).rejects.toThrow('抽出記録を保存できませんでした（422）')
  })
})

describe('updateBrewRecord', () => {
  it('PUT で全項目を送る', async () => {
    const fetchMock = stubFetch(true, 200, { id: 7 })
    await expect(updateBrewRecord(7, input)).resolves.toEqual({ id: 7 })
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('/api/brew-records/7')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init?.body as string)).toEqual(input)
  })

  it('404 のときは NotFoundError を投げる', async () => {
    stubFetch(false, 404)
    await expect(updateBrewRecord(99, input)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('それ以外のエラーはステータス付きのメッセージで投げる', async () => {
    stubFetch(false, 500)
    await expect(updateBrewRecord(7, input)).rejects.toThrow('抽出記録を保存できませんでした（500）')
  })
})

describe('deleteBrewRecord', () => {
  it('DELETE を送る', async () => {
    const fetchMock = stubFetch(true, 204)
    await expect(deleteBrewRecord(7)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('/api/brew-records/7', { method: 'DELETE' })
  })

  it('404 のときは NotFoundError を投げる', async () => {
    stubFetch(false, 404)
    await expect(deleteBrewRecord(99)).rejects.toBeInstanceOf(NotFoundError)
  })

  it('それ以外のエラーはステータス付きのメッセージで投げる', async () => {
    stubFetch(false, 500)
    await expect(deleteBrewRecord(7)).rejects.toThrow('抽出記録を削除できませんでした（500）')
  })
})
