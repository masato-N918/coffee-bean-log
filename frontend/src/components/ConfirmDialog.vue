<script setup lang="ts">
// 削除の確認ダイアログ。背景をクリックしたときもキャンセル扱いにする
defineProps<{
  title: string
  message?: string
  /** 削除中など、ボタンを押せなくするとき */
  busy?: boolean
}>()
const emit = defineEmits<{ cancel: []; ok: [] }>()
</script>

<template>
  <div class="overlay" @click.self="!busy && emit('cancel')">
    <div class="dialog" role="dialog" aria-modal="true" :aria-label="title">
      <p class="title">{{ title }}</p>
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
  </div>
</template>
