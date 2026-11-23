<script setup lang="ts">
// 削除の確認ダイアログ。ネイティブの <dialog> を showModal() で開くので、
// フォーカスがダイアログに移り、背面は操作できなくなる。
// Esc と背景（ダイアログの外側）のクリックはキャンセル扱いにする
import { onBeforeUnmount, onMounted, useId, useTemplateRef } from 'vue'

const props = defineProps<{
  title: string
  message?: string
  /** 削除中など、ボタンを押せなくするとき */
  busy?: boolean
}>()
const emit = defineEmits<{ cancel: []; ok: [] }>()

const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()

// 表示・非表示は親の v-if で決めるので、ここでは開くだけ
onMounted(() => dialog.value?.showModal())

// 閉じるときに close() を呼ぶと、ブラウザが開く前の要素（［削除］ボタン）にフォーカスを戻す
let unmounting = false
onBeforeUnmount(() => {
  unmounting = true
  dialog.value?.close()
})

/** Esc を押したとき。ブラウザに閉じさせず、親に知らせる */
function onEsc(e: Event) {
  e.preventDefault()
  if (!props.busy) emit('cancel')
}

/** ブラウザが自分で閉じたとき（Esc の連打など）も、親の状態をそろえる */
function onClose() {
  if (!unmounting) emit('cancel')
}

/** 背景のクリック。中身は .dialog-body が覆っているので、target が <dialog> なら外側 */
function onClick(e: MouseEvent) {
  if (e.target === dialog.value && !props.busy) emit('cancel')
}
</script>

<template>
  <dialog
    ref="dialog"
    class="dialog"
    :aria-labelledby="titleId"
    @cancel="onEsc"
    @close="onClose"
    @click="onClick"
  >
    <div class="dialog-body">
      <p :id="titleId" class="title">{{ title }}</p>
      <p v-if="message">{{ message }}</p>
      <div class="actions">
        <button class="btn" type="button" :disabled="busy" @click="emit('cancel')">
          キャンセル
        </button>
        <button class="btn danger solid" type="button" :disabled="busy" @click="emit('ok')">
          削除
        </button>
      </div>
    </div>
  </dialog>
</template>
