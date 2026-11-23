// 選択肢のコード値と表示名（docs/データ設計書.md の「4. 選択肢の保存値」）
import type { Bean, Process, RoastGroup, RoastLevel } from '@/types/bean'

interface Choice<T extends string> {
  value: T
  label: string
}

export const ROAST_GROUPS: Choice<RoastGroup>[] = [
  { value: 'light', label: '浅煎り' },
  { value: 'medium', label: '中煎り' },
  { value: 'medium_dark', label: '中深煎り' },
  { value: 'dark', label: '深煎り' },
]

export const ROAST_LEVELS: (Choice<RoastLevel> & { group: RoastGroup })[] = [
  { value: 'light', label: 'ライト', group: 'light' },
  { value: 'cinnamon', label: 'シナモン', group: 'light' },
  { value: 'medium', label: 'ミディアム', group: 'medium' },
  { value: 'high', label: 'ハイ', group: 'medium' },
  { value: 'city', label: 'シティ', group: 'medium_dark' },
  { value: 'full_city', label: 'フルシティ', group: 'medium_dark' },
  { value: 'french', label: 'フレンチ', group: 'dark' },
  { value: 'italian', label: 'イタリアン', group: 'dark' },
]

export const PROCESSES: Choice<Process>[] = [
  { value: 'washed', label: 'ウォッシュト' },
  { value: 'natural', label: 'ナチュラル' },
  { value: 'honey', label: 'ハニー' },
  { value: 'other', label: 'その他' },
]

export function labelOf<T extends string>(choices: Choice<T>[], value: T | null): string {
  return choices.find((c) => c.value === value)?.label ?? ''
}

/** 焙煎度の表示：「シティ（中深煎り）」／呼び方だけなら「中深煎り」／未入力なら空文字 */
export function roastText(bean: Pick<Bean, 'roast_group' | 'roast_level'>): string {
  if (bean.roast_level) {
    return `${labelOf(ROAST_LEVELS, bean.roast_level)}（${labelOf(ROAST_GROUPS, bean.roast_group)}）`
  }
  if (bean.roast_group) return labelOf(ROAST_GROUPS, bean.roast_group)
  return ''
}

/** 呼び方に属する8段階の一覧 */
export function levelsOf(group: RoastGroup) {
  return ROAST_LEVELS.filter((l) => l.group === group)
}
