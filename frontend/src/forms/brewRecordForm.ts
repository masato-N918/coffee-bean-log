// 抽出記録フォーム（S-4）の入力値と入力チェック。制約は docs/機能要件.md の「3.2 抽出記録の入力項目」
import type {
  BrewMethod,
  BrewRecord,
  BrewRecordInput,
  DoseUnit,
  GrindSize,
  Temperature,
  WaterUnit,
} from '@/types/brewRecord'

/**
 * 入力欄の値。文字列の欄は未入力なら空文字。
 * 単位は量が空でも常に値を持つ（量が空なら保存時に null にする）。
 * 数値の欄は、v-model が type="number" の値を数値に変えるので string | number。
 */
export interface BrewRecordFormValues {
  brewed_on: string
  method: BrewMethod | ''
  temperature: Temperature
  dose_amount: string | number
  dose_unit: DoseUnit
  water_amount: string | number
  water_unit: WaterUnit
  taste_memo: string
  equipment: string
  grind_size: GrindSize | ''
  water_temp_c: string | number
  brew_time_sec: string | number
}

export type BrewRecordFormErrors = Partial<Record<keyof BrewRecordFormValues, string>>

/** 詳細（任意）に入る項目。エラーが出たら詳細を開くのに使う */
export const DETAIL_KEYS = ['equipment', 'grind_size', 'water_temp_c', 'brew_time_sec'] as const

/** 単位ごとの量の範囲（backend の DOSE_RANGES / WATER_RANGES と同じ） */
const DOSE_RANGES: Record<DoseUnit, [number, number]> = { g: [0.1, 1000], cup: [0.5, 20] }
const WATER_RANGES: Record<WaterUnit, [number, number]> = { ml: [1, 5000], cup: [1, 20] }

/** 今日の日付（ローカル時刻）を YYYY-MM-DD で返す。toISOString は UTC なので使わない */
export function todayString(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 新規モードの初期値（抽出日は今日、ホット） */
export function emptyBrewRecordForm(today: string = todayString()): BrewRecordFormValues {
  return {
    brewed_on: today,
    method: '',
    temperature: 'hot',
    dose_amount: '',
    dose_unit: 'g',
    water_amount: '',
    water_unit: 'ml',
    taste_memo: '',
    equipment: '',
    grind_size: '',
    water_temp_c: '',
    brew_time_sec: '',
  }
}

/** 編集モードの初期値を、登録済みの抽出記録から作る */
export function brewRecordToForm(record: BrewRecord): BrewRecordFormValues {
  return {
    brewed_on: record.brewed_on,
    method: record.method,
    temperature: record.temperature,
    dose_amount: record.dose_amount ?? '',
    dose_unit: record.dose_unit ?? 'g',
    water_amount: record.water_amount ?? '',
    water_unit: record.water_unit ?? 'ml',
    taste_memo: record.taste_memo ?? '',
    equipment: record.equipment ?? '',
    grind_size: record.grind_size ?? '',
    water_temp_c: record.water_temp_c ?? '',
    brew_time_sec: record.brew_time_sec ?? '',
  }
}

/** 詳細（任意）の項目に値があるか（編集モードで詳細を最初から開くかどうか） */
export function hasDetail(record: BrewRecord): boolean {
  return DETAIL_KEYS.some((key) => record[key] != null && record[key] !== '')
}

/**
 * 入力チェックをして、API に送る値を作る。
 * エラーがあるときは input が null になり、errors に欄ごとのメッセージが入る。
 */
export function validateBrewRecordForm(values: BrewRecordFormValues): {
  errors: BrewRecordFormErrors
  input: BrewRecordInput | null
} {
  const errors: BrewRecordFormErrors = {}

  /** 前後の空白を取り、空なら null。最大文字数を超えたらエラー */
  const text = (key: 'taste_memo' | 'equipment', max: number): string | null => {
    const value = values[key].trim()
    if (value.length > max) errors[key] = `${max}文字以内で入力してください`
    return value === '' ? null : value
  }

  /** 空なら null。min〜max の整数でなければエラー */
  const int = (key: 'water_temp_c' | 'brew_time_sec', min: number, max: number): number | null => {
    const raw = String(values[key]).trim()
    if (raw === '') return null
    const n = Number(raw)
    if (!Number.isInteger(n) || n < min || n > max) {
      errors[key] = `${min}〜${max}の整数で入力してください`
      return null
    }
    return n
  }

  /** 空なら null。小数第1位までで min〜max に収まらなければエラー */
  const amount = (
    key: 'dose_amount' | 'water_amount',
    [min, max]: [number, number],
  ): number | null => {
    const raw = String(values[key]).trim()
    if (raw === '') return null
    const n = Number(raw)
    if (!/^\d+(\.\d)?$/.test(raw) || n < min || n > max) {
      errors[key] = `${min}〜${max}の範囲で、小数第1位までで入力してください`
      return null
    }
    return n
  }

  if (!values.brewed_on) errors.brewed_on = '抽出日を入力してください'
  if (!values.method) errors.method = '抽出方法を選択してください'

  const dose = amount('dose_amount', DOSE_RANGES[values.dose_unit])
  const water = amount('water_amount', WATER_RANGES[values.water_unit])

  const input: BrewRecordInput = {
    brewed_on: values.brewed_on,
    method: values.method as BrewMethod,
    temperature: values.temperature,
    dose_amount: dose,
    dose_unit: dose === null ? null : values.dose_unit,
    water_amount: water,
    water_unit: water === null ? null : values.water_unit,
    taste_memo: text('taste_memo', 1000),
    equipment: text('equipment', 100),
    grind_size: values.grind_size || null,
    water_temp_c: int('water_temp_c', 50, 100),
    brew_time_sec: int('brew_time_sec', 1, 3600),
  }

  return Object.keys(errors).length ? { errors, input: null } : { errors, input }
}
