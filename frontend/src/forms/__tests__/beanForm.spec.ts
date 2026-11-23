import { describe, expect, it } from 'vitest'

import { beanToForm, emptyBeanForm, validateBeanForm, type BeanFormValues } from '../beanForm'
import type { Bean } from '@/types/bean'

function form(overrides: Partial<BeanFormValues> = {}): BeanFormValues {
  return { ...emptyBeanForm(), name: '豆', ...overrides }
}

describe('validateBeanForm', () => {
  it('名前だけ入力すれば、ほかは null で送る', () => {
    const { errors, input } = validateBeanForm(form({ name: '  エチオピア  ' }))
    expect(errors).toEqual({})
    expect(input).toEqual({
      name: 'エチオピア',
      shop: null,
      origin: null,
      roast_group: null,
      roast_level: null,
      process: null,
      purchased_on: null,
      weight_g: null,
      price: null,
      rating: null,
      memo: null,
    })
  })

  it('すべて入力した値を API の形に変える', () => {
    const { input } = validateBeanForm(
      form({
        shop: ' 〇〇珈琲店 ',
        origin: 'エチオピア',
        roast: 'l:city',
        process: 'washed',
        purchased_on: '2026-11-18',
        weight_g: 200,
        price: '1500',
        rating: 4,
        memo: 'おすすめ',
      }),
    )
    expect(input).toMatchObject({
      shop: '〇〇珈琲店',
      roast_group: 'medium_dark',
      roast_level: 'city',
      process: 'washed',
      purchased_on: '2026-11-18',
      weight_g: 200,
      price: 1500,
      rating: 4,
      memo: 'おすすめ',
    })
  })

  it('焙煎度は呼び方だけでも選べる', () => {
    const { input } = validateBeanForm(form({ roast: 'g:medium' }))
    expect(input).toMatchObject({ roast_group: 'medium', roast_level: null })
  })

  it('名前が空（空白だけ）ならエラー', () => {
    const { errors, input } = validateBeanForm(form({ name: '   ' }))
    expect(input).toBeNull()
    expect(errors.name).toBe('豆の名前を入力してください')
  })

  it('文字数の上限を超えたらエラー', () => {
    const ok = validateBeanForm(
      form({ name: 'a'.repeat(100), shop: 'a'.repeat(100), memo: 'a'.repeat(1000) }),
    )
    expect(ok.errors).toEqual({})

    const { errors } = validateBeanForm(
      form({
        name: 'a'.repeat(101),
        shop: 'a'.repeat(101),
        origin: 'a'.repeat(101),
        memo: 'a'.repeat(1001),
      }),
    )
    expect(errors).toEqual({
      name: '100文字以内で入力してください',
      shop: '100文字以内で入力してください',
      origin: '100文字以内で入力してください',
      memo: '1000文字以内で入力してください',
    })
  })

  it.each([
    ['weight_g', 1],
    ['weight_g', 10000],
    ['price', 0],
    ['price', 1000000],
  ] as const)('%s = %s は範囲内', (key, value) => {
    const { errors, input } = validateBeanForm(form({ [key]: value }))
    expect(errors[key]).toBeUndefined()
    expect(input?.[key]).toBe(value)
  })

  it.each([
    ['weight_g', 0, '1〜10000の整数で入力してください'],
    ['weight_g', 10001, '1〜10000の整数で入力してください'],
    ['weight_g', 1.5, '1〜10000の整数で入力してください'],
    ['price', -1, '0〜1000000の整数で入力してください'],
    ['price', 1000001, '0〜1000000の整数で入力してください'],
  ] as const)('%s = %s は範囲外でエラー', (key, value, message) => {
    const { errors } = validateBeanForm(form({ [key]: value }))
    expect(errors[key]).toBe(message)
  })

  it('数値として読めない値はエラー', () => {
    const { errors } = validateBeanForm(form({ weight_g: 'abc' }))
    expect(errors.weight_g).toBe('1〜10000の整数で入力してください')
  })
})

describe('beanToForm', () => {
  const bean: Bean = {
    id: 1,
    name: 'エチオピア',
    shop: '〇〇珈琲店',
    origin: null,
    roast_group: 'medium_dark',
    roast_level: 'city',
    process: null,
    purchased_on: '2026-11-18',
    weight_g: 200,
    price: null,
    rating: 4,
    memo: null,
    created_at: '2026-11-23T10:00:00',
    updated_at: '2026-11-23T10:00:00',
  }

  it('null は空欄に、焙煎度は選択値に変える', () => {
    expect(beanToForm(bean)).toEqual({
      name: 'エチオピア',
      shop: '〇〇珈琲店',
      origin: '',
      roast: 'l:city',
      process: '',
      purchased_on: '2026-11-18',
      weight_g: 200,
      price: '',
      rating: 4,
      memo: '',
    })
    expect(beanToForm({ ...bean, roast_level: null }).roast).toBe('g:medium_dark')
    expect(beanToForm({ ...bean, roast_group: null, roast_level: null }).roast).toBe('')
  })

  it('フォームにして戻すと元の値になる', () => {
    const { id, created_at, updated_at, ...expected } = bean
    void [id, created_at, updated_at]
    expect(validateBeanForm(beanToForm(bean)).input).toEqual(expected)
  })
})
