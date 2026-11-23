<script setup lang="ts">
// 焙煎度の複数選択。呼び方ごとに「〇〇（すべて）」と8段階のチェックボックスを並べる
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue'

import { labelOf, levelsOf, ROAST_GROUPS, ROAST_LEVELS } from '@/constants/choices'
import type { RoastGroup, RoastLevel } from '@/types/bean'

/** 選択値。呼び方は 'g:medium'、8段階は 'l:city' の形 */
const model = defineModel<string[]>({ required: true })

const details = useTemplateRef<HTMLDetailsElement>('details')

const summary = computed(() =>
  model.value.length
    ? model.value
        .map((r) =>
          r.startsWith('g:')
            ? labelOf(ROAST_GROUPS, r.slice(2) as RoastGroup)
            : labelOf(ROAST_LEVELS, r.slice(2) as RoastLevel),
        )
        .join(', ')
    : '指定なし',
)

// パネルの外側をクリックしたら閉じる
function closeOnOutside(e: MouseEvent) {
  if (details.value && !details.value.contains(e.target as Node)) details.value.open = false
}
onMounted(() => document.addEventListener('click', closeOnOutside))
onUnmounted(() => document.removeEventListener('click', closeOnOutside))
</script>

<template>
  <details ref="details" class="multi">
    <summary>{{ summary }}</summary>
    <div class="multi-panel">
      <div v-for="g in ROAST_GROUPS" :key="g.value" class="multi-group">
        <label>
          <input v-model="model" type="checkbox" :value="'g:' + g.value" /> {{ g.label }}（すべて）
        </label>
        <label v-for="l in levelsOf(g.value)" :key="l.value" class="lvl">
          <input v-model="model" type="checkbox" :value="'l:' + l.value" /> {{ l.label }}
        </label>
      </div>
    </div>
  </details>
</template>
