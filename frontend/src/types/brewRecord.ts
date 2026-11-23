// 抽出記録（brew_records）の型。backend/app/schemas/brew_record.py の BrewRecordRead に合わせる

export type BrewMethod = 'hand_drip' | 'machine' | 'french_press' | 'espresso' | 'other'

export type Temperature = 'hot' | 'ice'

export type GrindSize = 'extra_fine' | 'fine' | 'medium_fine' | 'medium' | 'coarse'

export type DoseUnit = 'g' | 'cup'

export type WaterUnit = 'ml' | 'cup'

export interface BrewRecord {
  id: number
  bean_id: number
  brewed_on: string // YYYY-MM-DD
  method: BrewMethod
  temperature: Temperature
  dose_amount: number | null
  dose_unit: DoseUnit | null
  water_amount: number | null
  water_unit: WaterUnit | null
  equipment: string | null
  grind_size: GrindSize | null
  water_temp_c: number | null
  brew_time_sec: number | null
  taste_memo: string | null
  created_at: string
  updated_at: string
}

/** 登録・編集で API に送る値（backend の BrewRecordCreate / BrewRecordUpdate） */
export type BrewRecordInput = Omit<BrewRecord, 'id' | 'bean_id' | 'created_at' | 'updated_at'>
