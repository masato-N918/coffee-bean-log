// 豆フォーム（S-3）の入力値と入力チェック。制約は docs/機能要件.md の「3.1 豆の入力項目」
import { ROAST_LEVELS } from '@/constants/choices'
import type { Bean, BeanInput, Process, RoastGroup, RoastLevel } from '@/types/bean'

/**
 * 入力欄の値。文字列の欄は未入力なら空文字。
 * 焙煎度は 'g:medium'（呼び方だけ）/ 'l:city'（8段階）/ ''（選択しない）の形で持つ。
 * 数値の欄は、v-model が type="number" の値を数値に変えるので string | number。
 */
export interface BeanFormValues {
  name: string
  shop: string
  origin: string
  roast: string
  process: Process | ''
  purchased_on: string
  weight_g: string | number
  price: string | number
  rating: number | null
  memo: string
}

export type BeanFormErrors = Partial<Record<keyof BeanFormValues, string>>

export function emptyBeanForm(): BeanFormValues {
  return {
    name: '',
    shop: '',
    origin: '',
    roast: '',
    process: '',
    purchased_on: '',
    weight_g: '',
    price: '',
    rating: null,
    memo: '',
  }
}

/** 編集モードの初期値を、登録済みの豆から作る */
export function beanToForm(bean: Bean): BeanFormValues {
  return {
    name: bean.name,
    shop: bean.shop ?? '',
    origin: bean.origin ?? '',
    roast: bean.roast_level
      ? `l:${bean.roast_level}`
      : bean.roast_group
        ? `g:${bean.roast_group}`
        : '',
    process: bean.process ?? '',
    purchased_on: bean.purchased_on ?? '',
    weight_g: bean.weight_g ?? '',
    price: bean.price ?? '',
    rating: bean.rating,
    memo: bean.memo ?? '',
  }
}

/** 焙煎度の選択値を、呼び方と8段階に分ける（8段階なら呼び方も自動で入れる） */
function parseRoast(roast: string): Pick<BeanInput, 'roast_group' | 'roast_level'> {
  if (roast.startsWith('l:')) {
    const level = ROAST_LEVELS.find((l) => l.value === roast.slice(2))
    if (level) return { roast_group: level.group, roast_level: level.value as RoastLevel }
  }
  if (roast.startsWith('g:')) {
    return { roast_group: roast.slice(2) as RoastGroup, roast_level: null }
  }
  return { roast_group: null, roast_level: null }
}

/**
 * 入力チェックをして、API に送る値を作る。
 * エラーがあるときは input が null になり、errors に欄ごとのメッセージが入る。
 */
export function validateBeanForm(values: BeanFormValues): {
  errors: BeanFormErrors
  input: BeanInput | null
} {
  const errors: BeanFormErrors = {}

  /** 前後の空白を取り、空なら null。最大文字数を超えたらエラー */
  const text = (key: keyof BeanFormValues, max: number): string | null => {
    const value = String(values[key] ?? '').trim()
    if (value.length > max) errors[key] = `${max}文字以内で入力してください`
    return value === '' ? null : value
  }

  /** 空なら null。min〜max の整数でなければエラー */
  const int = (key: 'weight_g' | 'price', min: number, max: number): number | null => {
    const raw = String(values[key]).trim()
    if (raw === '') return null
    const n = Number(raw)
    if (!Number.isInteger(n) || n < min || n > max) {
      errors[key] = `${min}〜${max}の整数で入力してください`
      return null
    }
    return n
  }

  const name = text('name', 100)
  if (name === null) errors.name = '豆の名前を入力してください'
  const input: BeanInput = {
    name: name ?? '',
    shop: text('shop', 100),
    origin: text('origin', 100),
    ...parseRoast(values.roast),
    process: values.process || null,
    purchased_on: values.purchased_on || null,
    weight_g: int('weight_g', 1, 10000),
    price: int('price', 0, 1000000),
    rating: values.rating,
    memo: text('memo', 1000),
  }

  return Object.keys(errors).length ? { errors, input: null } : { errors, input }
}
