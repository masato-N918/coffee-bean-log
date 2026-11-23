import type { Bean } from '@/types/bean'

// 開発時は vite.config.ts のプロキシで /api をバックエンド（FastAPI）に転送する
const BASE_URL = '/api/beans'

/** 豆の一覧を取得する（新しい順） */
export async function fetchBeans(): Promise<Bean[]> {
  const res = await fetch(BASE_URL)
  if (!res.ok) {
    throw new Error(`豆の一覧を取得できませんでした（${res.status}）`)
  }
  return res.json()
}
