<script setup lang="ts">
// 評価の表示用（★★★★☆）。未評価のときは「未評価」と表示する
defineProps<{ rating: number | null }>()
</script>

<template>
  <!-- role="img" を付けると、★の記号ではなく aria-label が読み上げられる -->
  <span v-if="rating" class="stars" role="img" :aria-label="`評価 ${rating}`">
    {{ '★'.repeat(rating) + '☆'.repeat(5 - rating) }}
  </span>
  <span v-else class="muted">未評価</span>
</template>
