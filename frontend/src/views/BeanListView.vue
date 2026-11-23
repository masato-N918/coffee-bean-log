<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { fetchBeans } from '@/api/beans'
import RatingStars from '@/components/RatingStars.vue'
import { roastText } from '@/constants/choices'
import type { Bean } from '@/types/bean'

const beans = ref<Bean[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    beans.value = await fetchBeans()
  } catch (e) {
    error.value = e instanceof Error ? e.message : '豆の一覧を取得できませんでした'
  } finally {
    loading.value = false
  }
})

/** カードの2行目：「産地 ／ 焙煎度」（未入力の項目は出さない） */
const subText = (bean: Bean) => [bean.origin, roastText(bean)].filter(Boolean).join(' ／ ')
</script>

<template>
  <header class="topbar">
    <h1>☕ coffee-bean-log</h1>
    <!-- TODO: 豆フォーム画面（S-3）ができたら RouterLink にする -->
    <button class="btn primary" type="button" disabled>＋ 豆を登録</button>
  </header>

  <p v-if="loading" class="empty">読み込み中…</p>
  <p v-else-if="error" class="error" role="alert">{{ error }}</p>
  <p v-else-if="beans.length === 0" class="empty">まだ豆が登録されていません</p>
  <template v-else>
    <p class="count">{{ beans.length }}件</p>
    <!-- TODO: 豆詳細画面（S-2）ができたら RouterLink にする -->
    <div v-for="bean in beans" :key="bean.id" class="card bean-card">
      <div class="line1">
        <strong>{{ bean.name }}</strong>
        <RatingStars :rating="bean.rating" />
      </div>
      <div class="muted">{{ subText(bean) }}</div>
    </div>
  </template>
</template>
