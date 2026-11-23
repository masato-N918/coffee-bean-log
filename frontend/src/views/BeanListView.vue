<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { fetchBeans } from '@/api/beans'
import RatingStars from '@/components/RatingStars.vue'
import RoastMultiSelect from '@/components/RoastMultiSelect.vue'
import { roastText } from '@/constants/choices'
import { useBeanListStore } from '@/stores/beanList'
import type { Bean } from '@/types/bean'

const store = useBeanListStore()

const beans = ref<Bean[]>([])
const loading = ref(true)
const error = ref('')

// 後から出したリクエストの結果だけを使う（古いレスポンスが遅れて届いても上書きしない）
let requestId = 0
async function load() {
  const id = ++requestId
  try {
    const result = await fetchBeans(store.query)
    if (id !== requestId) return
    beans.value = result
    error.value = ''
  } catch (e) {
    if (id !== requestId) return
    error.value = e instanceof Error ? e.message : '豆の一覧を取得できませんでした'
  } finally {
    if (id === requestId) loading.value = false
  }
}

// 条件が変わるたびに取り直す（最初の表示でも取得する）
watch(() => store.query, load, { deep: true, immediate: true })

// 産地は入力が 300ms 止まってからストアに反映する（1文字ごとに API を呼ばない）
const originInput = ref(store.origin)
let originTimer: ReturnType<typeof setTimeout> | undefined
watch(originInput, (value) => {
  clearTimeout(originTimer)
  originTimer = setTimeout(() => (store.origin = value), 300)
})
// ［クリア］などでストア側が変わったときは入力欄にも反映する
watch(
  () => store.origin,
  (value) => {
    clearTimeout(originTimer)
    originInput.value = value
  },
)
onUnmounted(() => clearTimeout(originTimer))

/** カードの2行目：「産地 ／ 焙煎度」（未入力の項目は出さない） */
const subText = (bean: Bean) => [bean.origin, roastText(bean)].filter(Boolean).join(' ／ ')
</script>

<template>
  <header class="topbar">
    <h1>☕ coffee-bean-log</h1>
    <RouterLink class="btn primary" :to="{ name: 'bean-new' }">＋ 豆を登録</RouterLink>
  </header>

  <section class="card filters">
    <label class="field">
      <span>産地</span>
      <input v-model="originInput" type="text" placeholder="例: エチオピア" />
    </label>
    <div class="row" style="margin-top: 10px">
      <div class="field">
        <span>焙煎度</span>
        <RoastMultiSelect v-model="store.roasts" />
      </div>
      <label class="field">
        <span>評価</span>
        <select v-model="store.minRating">
          <option :value="null">指定なし</option>
          <option v-for="n in 5" :key="n" :value="n">★{{ n }} 以上</option>
        </select>
      </label>
    </div>
    <div class="between" style="margin-top: 12px">
      <fieldset class="sort">
        <legend>並び順</legend>
        <label><input v-model="store.sort" type="radio" value="newest" /> 新しい順</label>
        <label><input v-model="store.sort" type="radio" value="rating" /> 評価順</label>
      </fieldset>
      <button class="btn" type="button" @click="store.clearFilters()">クリア</button>
    </div>
  </section>

  <p v-if="loading" class="empty">読み込み中…</p>
  <p v-else-if="error" class="error" role="alert">{{ error }}</p>
  <p v-else-if="beans.length === 0 && !store.hasFilter" class="empty">まだ豆が登録されていません</p>
  <template v-else>
    <p class="count">{{ beans.length }}件</p>
    <p v-if="beans.length === 0" class="empty">条件に合う豆がありません</p>
    <RouterLink
      v-for="bean in beans"
      :key="bean.id"
      class="card bean-card"
      :to="{ name: 'bean-detail', params: { id: bean.id } }"
    >
      <div class="line1">
        <strong>{{ bean.name }}</strong>
        <RatingStars :rating="bean.rating" />
      </div>
      <div class="muted">{{ subText(bean) }}</div>
    </RouterLink>
  </template>
</template>
