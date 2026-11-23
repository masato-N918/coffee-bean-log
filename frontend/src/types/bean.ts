// 豆（beans）の型。backend/app/schemas/bean.py の BeanRead に合わせる

export type RoastGroup = 'light' | 'medium' | 'medium_dark' | 'dark'

export type RoastLevel =
  'light' | 'cinnamon' | 'medium' | 'high' | 'city' | 'full_city' | 'french' | 'italian'

export type Process = 'washed' | 'natural' | 'honey' | 'other'

export interface Bean {
  id: number
  name: string
  shop: string | null
  origin: string | null
  roast_group: RoastGroup | null
  roast_level: RoastLevel | null
  process: Process | null
  purchased_on: string | null // YYYY-MM-DD
  weight_g: number | null
  price: number | null
  rating: number | null // 1〜5。未評価は null
  memo: string | null
  created_at: string
  updated_at: string
}

/** 豆一覧の並び順（newest: 新しい順 / rating: 評価順） */
export type BeanSort = 'newest' | 'rating'

/** 豆一覧 API（GET /api/beans）の絞り込み・並び替えの条件 */
export interface BeanListQuery {
  origin?: string
  roast_group?: RoastGroup[]
  roast_level?: RoastLevel[]
  min_rating?: number
  sort?: BeanSort
}
