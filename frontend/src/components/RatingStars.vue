<script setup lang="ts">
// 評価の表示用（★★★★☆）。未評価のときは「未評価」と表示する
defineProps<{ rating: number | null }>()
</script>

<template>
  <span v-if="rating" class="stars" :aria-label="`評価 ${rating}`">
    {{ '★'.repeat(rating) + '☆'.repeat(5 - rating) }}
  </span>
  <span v-else class="muted">未評価</span>
</template>
