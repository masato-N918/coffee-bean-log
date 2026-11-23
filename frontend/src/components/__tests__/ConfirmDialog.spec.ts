import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ConfirmDialog from '../ConfirmDialog.vue'

describe('ConfirmDialog', () => {
  it('タイトルとメッセージを表示する', () => {
    const wrapper = mount(ConfirmDialog, {
      props: { title: 'この豆を削除しますか？', message: '抽出記録（3件）も一緒に削除されます。' },
    })
    expect(wrapper.find('.title').text()).toBe('この豆を削除しますか？')
    expect(wrapper.text()).toContain('抽出記録（3件）も一緒に削除されます。')
  })

  it('メッセージがなければタイトルだけを表示する', () => {
    const wrapper = mount(ConfirmDialog, { props: { title: '削除しますか？' } })
    expect(wrapper.findAll('.dialog p')).toHaveLength(1)
  })

  it('［削除］で ok、［キャンセル］と背景のクリックで cancel を出す', async () => {
    const wrapper = mount(ConfirmDialog, { props: { title: '削除しますか？' } })
    await wrapper.find('.btn.danger').trigger('click')
    expect(wrapper.emitted('ok')).toHaveLength(1)

    await wrapper.find('.actions .btn:not(.danger)').trigger('click')
    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(2)

    // ダイアログの中のクリックではキャンセルしない
    await wrapper.find('.dialog').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(2)
  })

  it('busy のときはボタンを押せず、背景のクリックでも閉じない', async () => {
    const wrapper = mount(ConfirmDialog, { props: { title: '削除しますか？', busy: true } })
    for (const b of wrapper.findAll('button')) {
      expect(b.attributes('disabled')).toBeDefined()
    }
    await wrapper.find('.overlay').trigger('click')
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })
})
