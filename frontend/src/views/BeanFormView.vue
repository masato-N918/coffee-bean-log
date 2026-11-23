<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { createBean, deleteBean, fetchBean, updateBean } from '@/api/beans'
import { fetchBrewRecords } from '@/api/brewRecords'
import { NotFoundError } from '@/api/errors'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StarRatingInput from '@/components/StarRatingInput.vue'
import { PROCESSES, ROAST_GROUPS, levelsOf } from '@/constants/choices'
import { beanToForm, emptyBeanForm, validateBeanForm, type BeanFormErrors } from '@/forms/beanForm'

// id があれば編集モード、なければ新規モード
const props = defineProps<{ id?: string }>()
const router = useRouter()

const isEdit = computed(() => props.id !== undefined)
const beanId = computed(() => Number(props.id))

const form = ref(emptyBeanForm())
const errors = ref<BeanFormErrors>({})
const formError = ref('')
const saving = ref(false)

// 編集モードで豆を読み込むときの状態
const loading = ref(false)
const notFound = ref(false)
const loadError = ref('')
const recordCount = ref(0)

// 削除の確認ダイアログ
const confirming = ref(false)
const deleting = ref(false)

let requestId = 0
async function load(id: number) {
  const current = ++requestId
  loading.value = true
  notFound.value = false
  loadError.value = ''
  try {
    const [bean, records] = await Promise.all([fetchBean(id), fetchBrewRecords(id)])
    if (current !== requestId) return
    form.value = beanToForm(bean)
    recordCount.value = records.length
  } catch (e) {
    if (current !== requestId) return
    if (e instanceof NotFoundError) notFound.value = true
    else loadError.value = e instanceof Error ? e.message : '豆の情報を取得できませんでした'
  } finally {
    if (current === requestId) loading.value = false
  }
}

watch(
  () => props.id,
  (id) => {
    errors.value = {}
    formError.value = ''
    if (id === undefined) {
      ++requestId
      form.value = emptyBeanForm()
      loading.value = false
      notFound.value = false
      loadError.value = ''
      return
    }
    const n = Number(id)
    if (Number.isInteger(n) && n > 0) {
      load(n)
    } else {
      ++requestId
      loading.value = false
      notFound.value = true
    }
  },
  { immediate: true },
)

const cancelTo = computed(() =>
  isEdit.value ? { name: 'bean-detail', params: { id: props.id } } : { name: 'bean-list' },
)

async function save() {
  if (saving.value) return
  const result = validateBeanForm(form.value)
  errors.value = result.errors
  if (!result.input) {
    formError.value = '入力内容に誤りがあります。赤字の項目を確認してください。'
    return
  }
  formError.value = ''
  saving.value = true
  try {
    const bean = isEdit.value
      ? await updateBean(beanId.value, result.input)
      : await createBean(result.input)
    // 戻るボタンでフォームに戻らないよう replace で移る
    await router.replace({ name: 'bean-detail', params: { id: bean.id } })
  } catch (e) {
    formError.value = e instanceof Error ? e.message : '豆を保存できませんでした'
  } finally {
    saving.value = false
  }
}

async function remove() {
  deleting.value = true
  try {
    await deleteBean(beanId.value)
    await router.replace({ name: 'bean-list' })
  } catch (e) {
    confirming.value = false
    formError.value = e instanceof Error ? e.message : '豆を削除できませんでした'
  } finally {
    deleting.value = false
  }
}

const deleteMessage = computed(() =>
  recordCount.value > 0 ? `抽出記録（${recordCount.value}件）も一緒に削除されます。` : '',
)
</script>

<template>
  <template v-if="isEdit && (loading || notFound || loadError)">
    <header class="topbar">
      <RouterLink class="link" :to="{ name: 'bean-list' }">← 一覧へ</RouterLink>
    </header>
    <p v-if="loading" class="empty">読み込み中…</p>
    <p v-else-if="notFound" class="empty">豆が見つかりません</p>
    <p v-else class="error" role="alert">{{ loadError }}</p>
  </template>

  <template v-else>
    <header class="topbar">
      <h1>{{ isEdit ? '豆を編集' : '豆を登録' }}</h1>
    </header>

    <form class="card form" novalidate @submit.prevent="save">
      <label class="field" :class="{ 'has-error': errors.name }">
        <span>豆の名前<em class="req">*</em></span>
        <input
          v-model="form.name"
          name="name"
          type="text"
          placeholder="例: エチオピア イルガチェフェ"
        />
        <small v-if="errors.name" class="err">{{ errors.name }}</small>
      </label>

      <label class="field" :class="{ 'has-error': errors.shop }">
        <span>購入店</span>
        <input v-model="form.shop" name="shop" type="text" placeholder="例: 〇〇珈琲店" />
        <small v-if="errors.shop" class="err">{{ errors.shop }}</small>
      </label>

      <label class="field" :class="{ 'has-error': errors.origin }">
        <span>産地</span>
        <input
          v-model="form.origin"
          name="origin"
          type="text"
          placeholder="例: エチオピア イルガチェフェ"
        />
        <small v-if="errors.origin" class="err">{{ errors.origin }}</small>
      </label>

      <label class="field">
        <span>焙煎度</span>
        <select v-model="form.roast" name="roast">
          <option value="">選択しない</option>
          <optgroup v-for="g in ROAST_GROUPS" :key="g.value" :label="g.label">
            <option :value="`g:${g.value}`">{{ g.label }}（細かい段階は不明）</option>
            <option v-for="l in levelsOf(g.value)" :key="l.value" :value="`l:${l.value}`">
              {{ l.label }}（{{ g.label }}）
            </option>
          </optgroup>
        </select>
      </label>

      <label class="field">
        <span>精製方法</span>
        <select v-model="form.process" name="process">
          <option value="">分からない・選択しない</option>
          <option v-for="p in PROCESSES" :key="p.value" :value="p.value">{{ p.label }}</option>
        </select>
      </label>

      <label class="field">
        <span>購入日</span>
        <input v-model="form.purchased_on" name="purchased_on" type="date" />
      </label>

      <div class="two">
        <label class="field" :class="{ 'has-error': errors.weight_g }">
          <span>内容量（g）</span>
          <input
            v-model="form.weight_g"
            name="weight_g"
            type="number"
            inputmode="numeric"
            placeholder="200"
          />
          <small v-if="errors.weight_g" class="err">{{ errors.weight_g }}</small>
        </label>
        <label class="field" :class="{ 'has-error': errors.price }">
          <span>価格（円）</span>
          <input
            v-model="form.price"
            name="price"
            type="number"
            inputmode="numeric"
            placeholder="1500"
          />
          <small v-if="errors.price" class="err">{{ errors.price }}</small>
        </label>
      </div>

      <div class="field">
        <span>評価</span>
        <StarRatingInput v-model="form.rating" />
      </div>

      <label class="field" :class="{ 'has-error': errors.memo }">
        <span>メモ</span>
        <textarea v-model="form.memo" name="memo" placeholder="例: 店員さんのおすすめ"></textarea>
        <small v-if="errors.memo" class="err">{{ errors.memo }}</small>
      </label>

      <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
      <div class="actions">
        <button
          v-if="isEdit"
          type="button"
          class="btn danger"
          :disabled="saving"
          @click="confirming = true"
        >
          削除
        </button>
        <span class="spacer"></span>
        <RouterLink class="btn cancel" :to="cancelTo">キャンセル</RouterLink>
        <button type="submit" class="btn primary" :disabled="saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </form>

    <ConfirmDialog
      v-if="confirming"
      title="この豆を削除しますか？"
      :message="deleteMessage"
      :busy="deleting"
      @cancel="confirming = false"
      @ok="remove"
    />
  </template>
</template>
