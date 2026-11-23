import { NotFoundError } from '@/api/errors'
import type { Bean, BeanInput, BeanListQuery } from '@/types/bean'

// 開発時は vite.config.ts のプロキシで /api をバックエンド（FastAPI）に転送する
const BASE_URL = '/api/beans'

/**
 * 豆一覧のクエリ文字列を作る。空の条件は送らない。
 * 焙煎度は ?roast_group=light&roast_group=dark のように同じキーを繰り返す（FastAPI の list Query の形）
 */
export function buildBeansQuery(query: BeanListQuery = {}): string {
  const params = new URLSearchParams()
  const origin = query.origin?.trim()
  if (origin) params.append('origin', origin)
  query.roast_group?.forEach((g) => params.append('roast_group', g))
  query.roast_level?.forEach((l) => params.append('roast_level', l))
  if (query.min_rating != null) params.append('min_rating', String(query.min_rating))
  if (query.sort) params.append('sort', query.sort)
  return params.toString()
}

/** 豆の一覧を取得する。条件を渡すと絞り込み・並び替えをする */
export async function fetchBeans(query: BeanListQuery = {}): Promise<Bean[]> {
  const qs = buildBeansQuery(query)
  const res = await fetch(qs ? `${BASE_URL}?${qs}` : BASE_URL)
  if (!res.ok) {
    throw new Error(`豆の一覧を取得できませんでした（${res.status}）`)
  }
  return res.json()
}

/** 豆を1件取得する。見つからないときは NotFoundError を投げる */
export async function fetchBean(id: number): Promise<Bean> {
  const res = await fetch(`${BASE_URL}/${id}`)
  if (res.status === 404) throw new NotFoundError('豆が見つかりません')
  if (!res.ok) {
    throw new Error(`豆の情報を取得できませんでした（${res.status}）`)
  }
  return res.json()
}

/** 豆を登録する。登録した豆（id 付き）を返す */
export async function createBean(input: BeanInput): Promise<Bean> {
  const res = await fetch(BASE_URL, jsonRequest('POST', input))
  if (!res.ok) throw new Error(`豆を保存できませんでした（${res.status}）`)
  return res.json()
}

/** 豆を編集する（全項目を置き換える） */
export async function updateBean(id: number, input: BeanInput): Promise<Bean> {
  const res = await fetch(`${BASE_URL}/${id}`, jsonRequest('PUT', input))
  if (res.status === 404) throw new NotFoundError('豆が見つかりません')
  if (!res.ok) throw new Error(`豆を保存できませんでした（${res.status}）`)
  return res.json()
}

/** 豆を削除する（その豆の抽出記録も一緒に削除される） */
export async function deleteBean(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (res.status === 404) throw new NotFoundError('豆が見つかりません')
  if (!res.ok) throw new Error(`豆を削除できませんでした（${res.status}）`)
}

export function jsonRequest(method: 'POST' | 'PUT', body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}
