import { describe, expect, it } from 'vitest'

import { amountText, roastText } from '../choices'

describe('roastText', () => {
  it('8段階があるときは「段階（呼び方）」と表示する', () => {
    expect(roastText({ roast_group: 'medium_dark', roast_level: 'city' })).toBe(
      'シティ（中深煎り）',
    )
  })

  it('呼び方だけのときは呼び方だけを表示する', () => {
    expect(roastText({ roast_group: 'medium_dark', roast_level: null })).toBe('中深煎り')
  })

  it('未入力のときは空文字を返す', () => {
    expect(roastText({ roast_group: null, roast_level: null })).toBe('')
  })
})

describe('amountText', () => {
  it('豆の量と湯量を「豆」「湯」を添えて表示する', () => {
    expect(
      amountText({ dose_amount: 15, dose_unit: 'g', water_amount: 240, water_unit: 'ml' }),
    ).toBe('豆 15 g ／ 湯 240 ml')
  })

  it('杯は「杯」と表示し、小数もそのまま表示する', () => {
    expect(
      amountText({ dose_amount: 1.5, dose_unit: 'cup', water_amount: 2, water_unit: 'cup' }),
    ).toBe('豆 1.5 杯 ／ 湯 2 杯')
  })

  it('片方だけのときはその量だけを表示する', () => {
    expect(
      amountText({ dose_amount: null, dose_unit: null, water_amount: 200, water_unit: 'ml' }),
    ).toBe('湯 200 ml')
  })

  it('どちらもないときは空文字を返す', () => {
    expect(
      amountText({ dose_amount: null, dose_unit: null, water_amount: null, water_unit: null }),
    ).toBe('')
  })
})
