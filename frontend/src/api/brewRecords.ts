import { jsonRequest } from '@/api/beans'
import { NotFoundError } from '@/api/errors'
import type { BrewRecord, BrewRecordInput } from '@/types/brewRecord'

/** 豆の抽出記録の一覧を取得する（抽出日の新しい順。並びはバックエンドが決める） */
export async function fetchBrewRecords(beanId: number): Promise<BrewRecord[]> {
  const res = await fetch(`/api/beans/${beanId}/brew-records`)
  if (res.status === 404) throw new NotFoundError('豆が見つかりません')
  if (!res.ok) {
    throw new Error(`抽出記録を取得できませんでした（${res.status}）`)
  }
  return res.json()
}

/** 抽出記録を1件取得する。見つからないときは NotFoundError を投げる */
export async function fetchBrewRecord(id: number): Promise<BrewRecord> {
  const res = await fetch(`/api/brew-records/${id}`)
  if (res.status === 404) throw new NotFoundError('抽出記録が見つかりません')
  if (!res.ok) {
    throw new Error(`抽出記録を取得できませんでした（${res.status}）`)
  }
  return res.json()
}

/** 豆に紐づけて抽出記録を登録する。登録した記録（id 付き）を返す */
export async function createBrewRecord(
  beanId: number,
  input: BrewRecordInput,
): Promise<BrewRecord> {
  const res = await fetch(`/api/beans/${beanId}/brew-records`, jsonRequest('POST', input))
  if (res.status === 404) throw new NotFoundError('豆が見つかりません')
  if (!res.ok) throw new Error(`抽出記録を保存できませんでした（${res.status}）`)
  return res.json()
}

/** 抽出記録を編集する（全項目を置き換える） */
export async function updateBrewRecord(id: number, input: BrewRecordInput): Promise<BrewRecord> {
  const res = await fetch(`/api/brew-records/${id}`, jsonRequest('PUT', input))
  if (res.status === 404) throw new NotFoundError('抽出記録が見つかりません')
  if (!res.ok) throw new Error(`抽出記録を保存できませんでした（${res.status}）`)
  return res.json()
}

/** 抽出記録を削除する */
export async function deleteBrewRecord(id: number): Promise<void> {
  const res = await fetch(`/api/brew-records/${id}`, { method: 'DELETE' })
  if (res.status === 404) throw new NotFoundError('抽出記録が見つかりません')
  if (!res.ok) throw new Error(`抽出記録を削除できませんでした（${res.status}）`)
}
