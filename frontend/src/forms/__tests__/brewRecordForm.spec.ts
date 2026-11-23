import { describe, expect, it } from 'vitest'

import {
  brewRecordToForm,
  emptyBrewRecordForm,
  hasDetail,
  todayString,
  validateBrewRecordForm,
  type BrewRecordFormValues,
} from '../brewRecordForm'
import type { BrewRecord } from '@/types/brewRecord'

function makeRecord(overrides: Partial<BrewRecord> = {}): BrewRecord {
  return {
    id: 1,
    bean_id: 1,
    brewed_on: '2026-11-20',
    method: 'hand_drip',
    temperature: 'hot',
    dose_amount: null,
    dose_unit: null,
    water_amount: null,
    water_unit: null,
    equipment: null,
    grind_size: null,
    water_temp_c: null,
    brew_time_sec: null,
    taste_memo: null,
    created_at: '2026-11-23T10:00:00',
    updated_at: '2026-11-23T10:00:00',
    ...overrides,
  }
}

/** 必須項目だけ入れたフォーム */
function validForm(overrides: Partial<BrewRecordFormValues> = {}): BrewRecordFormValues {
  return { ...emptyBrewRecordForm('2026-11-23'), method: 'machine', ...overrides }
}

describe('todayString', () => {
  it('ローカル時刻の日付を YYYY-MM-DD で返す', () => {
    expect(todayString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('emptyBrewRecordForm', () => {
  it('抽出日は渡した日付、ホット、単位は g / ml', () => {
    expect(emptyBrewRecordForm('2026-11-23')).toMatchObject({
      brewed_on: '2026-11-23',
      method: '',
      temperature: 'hot',
      dose_unit: 'g',
      water_unit: 'ml',
    })
  })
})

describe('brewRecordToForm', () => {
  it('登録済みの値を入力欄の形にする（null は空文字）', () => {
    const form = brewRecordToForm(
      makeRecord({
        method: 'machine',
        temperature: 'ice',
        dose_amount: 2,
        dose_unit: 'cup',
        water_amount: 240,
        water_unit: 'ml',
        grind_size: 'medium_fine',
        water_temp_c: 90,
      }),
    )
    expect(form).toEqual({
      brewed_on: '2026-11-20',
      method: 'machine',
      temperature: 'ice',
      dose_amount: 2,
      dose_unit: 'cup',
      water_amount: 240,
      water_unit: 'ml',
      taste_memo: '',
      equipment: '',
      grind_size: 'medium_fine',
      water_temp_c: 90,
      brew_time_sec: '',
    })
  })

  it('単位が null のときは g / ml を入れる', () => {
    const form = brewRecordToForm(makeRecord())
    expect(form.dose_unit).toBe('g')
    expect(form.water_unit).toBe('ml')
    expect(form.dose_amount).toBe('')
  })
})

describe('hasDetail', () => {
  it('詳細の項目がすべて空なら false', () => {
    expect(hasDetail(makeRecord({ taste_memo: 'メモ', dose_amount: 15, dose_unit: 'g' }))).toBe(
      false,
    )
  })

  it.each([
    { equipment: 'V60' },
    { grind_size: 'fine' as const },
    { water_temp_c: 90 },
    { brew_time_sec: 180 },
  ])('%o があれば true', (overrides) => {
    expect(hasDetail(makeRecord(overrides))).toBe(true)
  })
})

describe('validateBrewRecordForm', () => {
  it('必須項目だけで送る値を作る（任意項目は null）', () => {
    const { errors, input } = validateBrewRecordForm(validForm())
    expect(errors).toEqual({})
    expect(input).toEqual({
      brewed_on: '2026-11-23',
      method: 'machine',
      temperature: 'hot',
      dose_amount: null,
      dose_unit: null,
      water_amount: null,
      water_unit: null,
      taste_memo: null,
      equipment: null,
      grind_size: null,
      water_temp_c: null,
      brew_time_sec: null,
    })
  })

  it('抽出日と抽出方法が空ならエラー', () => {
    const { errors, input } = validateBrewRecordForm(validForm({ brewed_on: '', method: '' }))
    expect(input).toBeNull()
    expect(errors).toEqual({
      brewed_on: '抽出日を入力してください',
      method: '抽出方法を選択してください',
    })
  })

  it('すべて入力すると、量と単位をセットにして前後の空白を取る', () => {
    const { input } = validateBrewRecordForm(
      validForm({
        temperature: 'ice',
        dose_amount: 15.5,
        dose_unit: 'g',
        water_amount: '2',
        water_unit: 'cup',
        taste_memo: '  すっきり ',
        equipment: ' V60 ',
        grind_size: 'medium',
        water_temp_c: 90,
        brew_time_sec: '180',
      }),
    )
    expect(input).toMatchObject({
      temperature: 'ice',
      dose_amount: 15.5,
      dose_unit: 'g',
      water_amount: 2,
      water_unit: 'cup',
      taste_memo: 'すっきり',
      equipment: 'V60',
      grind_size: 'medium',
      water_temp_c: 90,
      brew_time_sec: 180,
    })
  })

  it.each([
    ['g', 0.1, true],
    ['g', 1000, true],
    ['g', 0, false],
    ['g', 1000.1, false],
    ['cup', 0.5, true],
    ['cup', 20, true],
    ['cup', 0.4, false],
    ['cup', 20.5, false],
  ] as const)('豆の量: %s で %s は OK=%s', (unit, value, okExpected) => {
    const { errors } = validateBrewRecordForm(validForm({ dose_amount: value, dose_unit: unit }))
    expect(errors.dose_amount === undefined).toBe(okExpected)
  })

  it.each([
    ['ml', 1, true],
    ['ml', 5000, true],
    ['ml', 0.9, false],
    ['ml', 5001, false],
    ['cup', 1, true],
    ['cup', 20, true],
    ['cup', 0.5, false],
    ['cup', 21, false],
  ] as const)('湯量: %s で %s は OK=%s', (unit, value, okExpected) => {
    const { errors } = validateBrewRecordForm(validForm({ water_amount: value, water_unit: unit }))
    expect(errors.water_amount === undefined).toBe(okExpected)
  })

  it('量が小数第2位まであるとエラー（メッセージに単位ごとの範囲を出す）', () => {
    const { errors } = validateBrewRecordForm(validForm({ dose_amount: 15.25, dose_unit: 'g' }))
    expect(errors.dose_amount).toBe('0.1〜1000の範囲で、小数第1位までで入力してください')
  })

  it('湯温・抽出時間は範囲内の整数でなければエラー', () => {
    const { errors } = validateBrewRecordForm(validForm({ water_temp_c: 49, brew_time_sec: 1.5 }))
    expect(errors.water_temp_c).toBe('50〜100の整数で入力してください')
    expect(errors.brew_time_sec).toBe('1〜3600の整数で入力してください')
  })

  it('文字数の上限を超えるとエラー', () => {
    const { errors } = validateBrewRecordForm(
      validForm({ equipment: 'a'.repeat(101), taste_memo: 'a'.repeat(1001) }),
    )
    expect(errors.equipment).toBe('100文字以内で入力してください')
    expect(errors.taste_memo).toBe('1000文字以内で入力してください')
  })

  it('上限ちょうどの文字数は OK', () => {
    const { errors } = validateBrewRecordForm(
      validForm({ equipment: 'a'.repeat(100), taste_memo: 'a'.repeat(1000) }),
    )
    expect(errors).toEqual({})
  })
})
