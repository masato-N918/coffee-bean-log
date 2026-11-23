import { NotFoundError } from '@/api/errors'
import type { BrewRecord } from '@/types/brewRecord'

/** 豆の抽出記録の一覧を取得する（抽出日の新しい順。並びはバックエンドが決める） */
export async function fetchBrewRecords(beanId: number): Promise<BrewRecord[]> {
  const res = await fetch(`/api/beans/${beanId}/brew-records`)
  if (res.status === 404) throw new NotFoundError('豆が見つかりません')
  if (!res.ok) {
    throw new Error(`抽出記録を取得できませんでした（${res.status}）`)
  }
  return res.json()
}
