<script setup lang="ts">
// 評価の入力（★1〜5）。同じ★をもう一度押すと未評価（null）に戻す
const rating = defineModel<number | null>({ required: true })

function toggle(n: number) {
  rating.value = rating.value === n ? null : n
}
</script>

<template>
  <div class="rating">
    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star"
      :class="{ on: (rating ?? 0) >= n }"
      :aria-label="`評価 ${n}`"
      :aria-pressed="rating === n"
      @click="toggle(n)"
    >
      {{ (rating ?? 0) >= n ? '★' : '☆' }}
    </button>
    <span class="hint muted">
      {{
        rating ? '同じ★をもう一度押すと未評価に戻ります' : '未評価（飲んでからでも付けられます）'
      }}
    </span>
  </div>
</template>
