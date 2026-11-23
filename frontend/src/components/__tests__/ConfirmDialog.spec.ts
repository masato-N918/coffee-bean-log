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

  it('モーダルとして開き、タイトルをダイアログの名前にする', () => {
    const wrapper = mount(ConfirmDialog, { props: { title: '削除しますか？' } })
    const dialog = wrapper.find('dialog')
    expect((dialog.element as HTMLDialogElement).open).toBe(true)
    const titleId = dialog.attributes('aria-labelledby')
    expect(titleId).toBeTruthy()
    expect(wrapper.find(`[id="${titleId}"]`).text()).toBe('削除しますか？')
  })

  it('［削除］で ok、［キャンセル］・背景のクリック・Esc で cancel を出す', async () => {
    const wrapper = mount(ConfirmDialog, { props: { title: '削除しますか？' } })
    await wrapper.find('.btn.danger').trigger('click')
    expect(wrapper.emitted('ok')).toHaveLength(1)

    await wrapper.find('.actions .btn:not(.danger)').trigger('click')
    // 背景（::backdrop）のクリックは <dialog> 自身へのクリックとして届く
    await wrapper.find('dialog').trigger('click')
    // Esc を押すと cancel イベントが届く。ブラウザには閉じさせない
    const esc = new Event('cancel', { cancelable: true })
    wrapper.find('dialog').element.dispatchEvent(esc)
    expect(esc.defaultPrevented).toBe(true)
    expect(wrapper.emitted('cancel')).toHaveLength(3)

    // ダイアログの中のクリックではキャンセルしない
    await wrapper.find('.dialog-body').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(3)
  })

  it('busy のときはボタンを押せず、背景のクリックや Esc でも閉じない', async () => {
    const wrapper = mount(ConfirmDialog, { props: { title: '削除しますか？', busy: true } })
    for (const b of wrapper.findAll('button')) {
      expect(b.attributes('disabled')).toBeDefined()
    }
    await wrapper.find('dialog').trigger('click')
    wrapper.find('dialog').element.dispatchEvent(new Event('cancel', { cancelable: true }))
    expect(wrapper.emitted('cancel')).toBeUndefined()
  })

  it('ブラウザが自分で閉じたときも cancel を出し、親が消したときは出さない', async () => {
    const wrapper = mount(ConfirmDialog, { props: { title: '削除しますか？' } })
    ;(wrapper.find('dialog').element as HTMLDialogElement).close()
    expect(wrapper.emitted('cancel')).toHaveLength(1)

    const other = mount(ConfirmDialog, { props: { title: '削除しますか？' } })
    const dialog = other.find('dialog').element as HTMLDialogElement
    other.unmount()
    expect(dialog.open).toBe(false)
    expect(other.emitted('cancel')).toBeUndefined()
  })
})
