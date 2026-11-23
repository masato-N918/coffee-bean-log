<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { fetchBean } from '@/api/beans'
import { fetchBrewRecords } from '@/api/brewRecords'
import { NotFoundError } from '@/api/errors'
import RatingStars from '@/components/RatingStars.vue'
import {
  BREW_METHODS,
  PROCESSES,
  TEMPERATURES,
  amountText,
  labelOf,
  roastText,
} from '@/constants/choices'
import type { Bean } from '@/types/bean'
import type { BrewRecord } from '@/types/brewRecord'

const props = defineProps<{ id: string }>()

const bean = ref<Bean | null>(null)
const records = ref<BrewRecord[]>([])
const loading = ref(true)
const notFound = ref(false)
const error = ref('')

// 後から出したリクエストの結果だけを使う（別の豆に切り替わったときに古い結果で上書きしない）
let requestId = 0
async function load(id: number) {
  const current = ++requestId
  loading.value = true
  notFound.value = false
  error.value = ''
  try {
    const [b, r] = await Promise.all([fetchBean(id), fetchBrewRecords(id)])
    if (current !== requestId) return
    bean.value = b
    records.value = r
  } catch (e) {
    if (current !== requestId) return
    bean.value = null
    records.value = []
    if (e instanceof NotFoundError) notFound.value = true
    else error.value = e instanceof Error ? e.message : '豆の情報を取得できませんでした'
  } finally {
    if (current === requestId) loading.value = false
  }
}

watch(
  () => props.id,
  (id) => {
    const n = Number(id)
    if (Number.isInteger(n) && n > 0) {
      load(n)
    } else {
      // /beans/abc のような URL は API を呼ばずに「見つかりません」にする
      ++requestId
      bean.value = null
      loading.value = false
      notFound.value = true
    }
  },
  { immediate: true },
)

/** 豆の情報の行（未入力の項目は出さない） */
const rows = computed<[string, string][]>(() => {
  const b = bean.value
  if (!b) return []
  const all: [string, string | null][] = [
    ['購入店', b.shop],
    ['産地', b.origin],
    ['焙煎度', roastText(b)],
    ['精製方法', labelOf(PROCESSES, b.process)],
    ['購入日', b.purchased_on],
    ['内容量', b.weight_g != null ? `${b.weight_g} g` : null],
    ['価格', b.price != null ? `${b.price.toLocaleString()} 円` : null],
    ['メモ', b.memo],
  ]
  return all.filter((row): row is [string, string] => !!row[1]?.trim())
})
</script>

<template>
  <header class="topbar">
    <RouterLink class="link" :to="{ name: 'bean-list' }">← 一覧へ</RouterLink>
    <RouterLink v-if="bean" class="btn" :to="{ name: 'bean-edit', params: { id: bean.id } }">
      編集
    </RouterLink>
  </header>

  <p v-if="loading" class="empty">読み込み中…</p>
  <p v-else-if="notFound" class="empty">豆が見つかりません</p>
  <p v-else-if="error" class="error" role="alert">{{ error }}</p>
  <template v-else-if="bean">
    <section class="card bean-info">
      <div class="detail-head">
        <h2>{{ bean.name }}</h2>
        <RatingStars :rating="bean.rating" />
      </div>
      <dl v-if="rows.length" class="info">
        <template v-for="[label, value] in rows" :key="label">
          <dt>{{ label }}</dt>
          <dd>{{ value }}</dd>
        </template>
      </dl>
    </section>

    <div class="section-head">
      <h3>抽出記録（{{ records.length }}件）</h3>
      <!-- TODO: 抽出記録フォーム画面（S-4）ができたら RouterLink にする -->
      <button class="btn primary" type="button" disabled>＋ 記録を追加</button>
    </div>
    <p v-if="records.length === 0" class="empty">まだ記録がありません</p>
    <!-- TODO: 抽出記録フォーム画面（S-4）ができたら RouterLink（編集モード）にする -->
    <div v-for="r in records" :key="r.id" class="card record-card">
      <div>
        <strong>{{ r.brewed_on }}</strong
        >　{{ labelOf(BREW_METHODS, r.method) }}・<span :class="`temp-${r.temperature}`">{{
          labelOf(TEMPERATURES, r.temperature)
        }}</span>
      </div>
      <div v-if="amountText(r)" class="muted">{{ amountText(r) }}</div>
      <div v-if="r.taste_memo" class="memo">{{ r.taste_memo }}</div>
    </div>
  </template>
</template>
