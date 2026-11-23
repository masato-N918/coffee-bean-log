<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { fetchBean } from '@/api/beans'
import {
  createBrewRecord,
  deleteBrewRecord,
  fetchBrewRecord,
  updateBrewRecord,
} from '@/api/brewRecords'
import { NotFoundError } from '@/api/errors'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import { BREW_METHODS, GRIND_SIZES, TEMPERATURES, UNIT_LABELS } from '@/constants/choices'
import {
  DETAIL_KEYS,
  brewRecordToForm,
  emptyBrewRecordForm,
  hasDetail,
  validateBrewRecordForm,
  type BrewRecordFormErrors,
} from '@/forms/brewRecordForm'
import type { DoseUnit, WaterUnit } from '@/types/brewRecord'

// recordId があれば編集モード、なければ新規モード
const props = defineProps<{ beanId: string; recordId?: string }>()
const router = useRouter()

const isEdit = computed(() => props.recordId !== undefined)

const DOSE_UNITS: DoseUnit[] = ['g', 'cup']
const WATER_UNITS: WaterUnit[] = ['ml', 'cup']

const form = ref(emptyBrewRecordForm())
const errors = ref<BrewRecordFormErrors>({})
const formError = ref('')
const saving = ref(false)
const detailOpen = ref(false)
const beanName = ref('')

// 豆（と編集モードでは抽出記録）を読み込むときの状態
const loading = ref(true)
const notFound = ref('')
const loadError = ref('')

// 削除の確認ダイアログ
const confirming = ref(false)
const deleting = ref(false)

const toId = (s: string | undefined) => {
  const n = Number(s)
  return Number.isInteger(n) && n > 0 ? n : null
}

let requestId = 0
async function load(beanId: number, recordId: number | null) {
  const current = ++requestId
  loading.value = true
  notFound.value = ''
  loadError.value = ''
  try {
    const [bean, record] = await Promise.all([
      fetchBean(beanId),
      recordId === null ? Promise.resolve(null) : fetchBrewRecord(recordId),
    ])
    if (current !== requestId) return
    // 別の豆の記録を、この豆の URL で開いたときは「見つかりません」にする
    if (record && record.bean_id !== beanId) {
      notFound.value = '抽出記録が見つかりません'
      return
    }
    beanName.value = bean.name
    form.value = record ? brewRecordToForm(record) : emptyBrewRecordForm()
    detailOpen.value = record ? hasDetail(record) : false
  } catch (e) {
    if (current !== requestId) return
    if (e instanceof NotFoundError) notFound.value = e.message
    else loadError.value = e instanceof Error ? e.message : '情報を取得できませんでした'
  } finally {
    if (current === requestId) loading.value = false
  }
}

watch(
  () => [props.beanId, props.recordId] as const,
  ([beanIdStr, recordIdStr]) => {
    errors.value = {}
    formError.value = ''
    confirming.value = false
    const beanId = toId(beanIdStr)
    const recordId = recordIdStr === undefined ? null : toId(recordIdStr)
    if (beanId === null) {
      ++requestId
      loading.value = false
      notFound.value = '豆が見つかりません'
    } else if (recordIdStr !== undefined && recordId === null) {
      ++requestId
      loading.value = false
      notFound.value = '抽出記録が見つかりません'
    } else {
      load(beanId, recordId)
    }
  },
  { immediate: true },
)

const backTo = computed(() => ({ name: 'bean-detail', params: { id: props.beanId } }))

async function save() {
  if (saving.value) return
  const result = validateBrewRecordForm(form.value)
  errors.value = result.errors
  if (!result.input) {
    // 詳細の欄にエラーがあれば、見えるように詳細を開く
    if (DETAIL_KEYS.some((key) => result.errors[key])) detailOpen.value = true
    formError.value = '入力内容に誤りがあります。赤字の項目を確認してください。'
    return
  }
  formError.value = ''
  saving.value = true
  try {
    if (isEdit.value) await updateBrewRecord(Number(props.recordId), result.input)
    else await createBrewRecord(Number(props.beanId), result.input)
    // 戻るボタンでフォームに戻らないよう replace で移る
    await router.replace(backTo.value)
  } catch (e) {
    formError.value = e instanceof Error ? e.message : '抽出記録を保存できませんでした'
  } finally {
    saving.value = false
  }
}

async function remove() {
  deleting.value = true
  try {
    await deleteBrewRecord(Number(props.recordId))
    await router.replace(backTo.value)
  } catch (e) {
    confirming.value = false
    formError.value = e instanceof Error ? e.message : '抽出記録を削除できませんでした'
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <template v-if="loading || notFound || loadError">
    <header class="topbar">
      <RouterLink class="link" :to="backTo">← 豆の詳細へ</RouterLink>
    </header>
    <p v-if="loading" class="empty">読み込み中…</p>
    <p v-else-if="notFound" class="empty">{{ notFound }}</p>
    <p v-else class="error" role="alert">{{ loadError }}</p>
  </template>

  <template v-else>
    <header class="topbar">
      <h1>{{ isEdit ? '記録を編集' : '記録を追加' }}</h1>
    </header>
    <p class="sub">{{ beanName }}</p>

    <form class="card form" novalidate @submit.prevent="save">
      <label class="field" :class="{ 'has-error': errors.brewed_on }">
        <span>抽出日<em class="req">*</em></span>
        <input v-model="form.brewed_on" name="brewed_on" type="date" />
        <small v-if="errors.brewed_on" class="err">{{ errors.brewed_on }}</small>
      </label>

      <label class="field" :class="{ 'has-error': errors.method }">
        <span>抽出方法<em class="req">*</em></span>
        <select v-model="form.method" name="method">
          <option value="" disabled>選択してください</option>
          <option v-for="m in BREW_METHODS" :key="m.value" :value="m.value">{{ m.label }}</option>
        </select>
        <small v-if="errors.method" class="err">{{ errors.method }}</small>
      </label>

      <div class="field">
        <span>ホット / アイス<em class="req">*</em></span>
        <div class="segmented" role="radiogroup" aria-label="ホット / アイス">
          <label
            v-for="t in TEMPERATURES"
            :key="t.value"
            :class="{ on: form.temperature === t.value }"
          >
            <input v-model="form.temperature" type="radio" name="temperature" :value="t.value" />
            {{ t.label }}
          </label>
        </div>
      </div>

      <div class="two">
        <div class="field" :class="{ 'has-error': errors.dose_amount }">
          <span>豆の量</span>
          <div class="amount">
            <input
              v-model="form.dose_amount"
              name="dose_amount"
              type="number"
              inputmode="decimal"
              step="0.1"
              :placeholder="form.dose_unit === 'g' ? '15' : '2'"
              aria-label="豆の量"
            />
            <select v-model="form.dose_unit" name="dose_unit" aria-label="豆の量の単位">
              <option v-for="u in DOSE_UNITS" :key="u" :value="u">{{ UNIT_LABELS[u] }}</option>
            </select>
          </div>
          <small v-if="errors.dose_amount" class="err">{{ errors.dose_amount }}</small>
        </div>
        <div class="field" :class="{ 'has-error': errors.water_amount }">
          <span>湯量</span>
          <div class="amount">
            <input
              v-model="form.water_amount"
              name="water_amount"
              type="number"
              inputmode="decimal"
              step="0.1"
              :placeholder="form.water_unit === 'ml' ? '240' : '2'"
              aria-label="湯量"
            />
            <select v-model="form.water_unit" name="water_unit" aria-label="湯量の単位">
              <option v-for="u in WATER_UNITS" :key="u" :value="u">{{ UNIT_LABELS[u] }}</option>
            </select>
          </div>
          <small v-if="errors.water_amount" class="err">{{ errors.water_amount }}</small>
        </div>
      </div>

      <label class="field" :class="{ 'has-error': errors.taste_memo }">
        <span>味のメモ</span>
        <textarea
          v-model="form.taste_memo"
          name="taste_memo"
          placeholder="例: 酸味が明るく、後味がすっきり"
        ></textarea>
        <small v-if="errors.taste_memo" class="err">{{ errors.taste_memo }}</small>
      </label>

      <button
        type="button"
        class="toggle"
        :aria-expanded="detailOpen"
        aria-controls="brew-detail"
        @click="detailOpen = !detailOpen"
      >
        {{ detailOpen ? '▼' : '▶' }} 詳細（任意）
      </button>
      <div v-show="detailOpen" id="brew-detail" class="details-box">
        <label class="field" :class="{ 'has-error': errors.equipment }">
          <span>器具・マシン名</span>
          <input
            v-model="form.equipment"
            name="equipment"
            type="text"
            placeholder="例: ハリオ V60 / 〇〇社 全自動マシン"
          />
          <small v-if="errors.equipment" class="err">{{ errors.equipment }}</small>
        </label>
        <label class="field">
          <span>挽き目</span>
          <select v-model="form.grind_size" name="grind_size">
            <option value="">選択しない</option>
            <option v-for="g in GRIND_SIZES" :key="g.value" :value="g.value">{{ g.label }}</option>
          </select>
        </label>
        <div class="two">
          <label class="field" :class="{ 'has-error': errors.water_temp_c }">
            <span>湯温（℃）</span>
            <input
              v-model="form.water_temp_c"
              name="water_temp_c"
              type="number"
              inputmode="numeric"
              placeholder="90"
            />
            <small v-if="errors.water_temp_c" class="err">{{ errors.water_temp_c }}</small>
          </label>
          <label class="field" :class="{ 'has-error': errors.brew_time_sec }">
            <span>抽出時間（秒）</span>
            <input
              v-model="form.brew_time_sec"
              name="brew_time_sec"
              type="number"
              inputmode="numeric"
              placeholder="180"
            />
            <small v-if="errors.brew_time_sec" class="err">{{ errors.brew_time_sec }}</small>
          </label>
        </div>
      </div>

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
        <RouterLink class="btn cancel" :to="backTo">キャンセル</RouterLink>
        <button type="submit" class="btn primary" :disabled="saving">
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </form>

    <ConfirmDialog
      v-if="confirming"
      title="この抽出記録を削除しますか？"
      :busy="deleting"
      @cancel="confirming = false"
      @ok="remove"
    />
  </template>
</template>
