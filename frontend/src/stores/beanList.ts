// 豆一覧の絞り込み・並び順の条件。
// ストアに置くことで、豆詳細から一覧に戻ったときも条件が保たれる
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import type { BeanListQuery, BeanSort, RoastGroup, RoastLevel } from '@/types/bean'

export const useBeanListStore = defineStore('beanList', () => {
  const origin = ref('')
  /** 焙煎度の選択。呼び方は 'g:medium'、8段階は 'l:city' の形で持つ */
  const roasts = ref<string[]>([])
  const minRating = ref<number | null>(null)
  const sort = ref<BeanSort>('newest')

  /** API に渡す条件 */
  const query = computed<BeanListQuery>(() => ({
    origin: origin.value.trim() || undefined,
    roast_group: roasts.value
      .filter((r) => r.startsWith('g:'))
      .map((r) => r.slice(2) as RoastGroup),
    roast_level: roasts.value
      .filter((r) => r.startsWith('l:'))
      .map((r) => r.slice(2) as RoastLevel),
    min_rating: minRating.value ?? undefined,
    sort: sort.value,
  }))

  /** 絞り込み条件が1つでも入っているか（並び順は含めない） */
  const hasFilter = computed(
    () => origin.value.trim() !== '' || roasts.value.length > 0 || minRating.value !== null,
  )

  /** 絞り込み条件をすべて解除する（並び順はそのまま） */
  function clearFilters() {
    origin.value = ''
    roasts.value = []
    minRating.value = null
  }

  return { origin, roasts, minRating, sort, query, hasFilter, clearFilters }
})
