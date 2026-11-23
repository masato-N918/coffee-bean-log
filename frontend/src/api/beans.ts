import type { Bean, BeanListQuery } from '@/types/bean'

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
