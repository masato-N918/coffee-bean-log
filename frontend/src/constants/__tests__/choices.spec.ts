import { describe, expect, it } from 'vitest'

import { roastText } from '../choices'

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
