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
