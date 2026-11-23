import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import StarRatingInput from '../StarRatingInput.vue'

describe('StarRatingInput', () => {
  it('未評価のときは☆を5つと案内を表示する', () => {
    const wrapper = mount(StarRatingInput, { props: { modelValue: null } })
    expect(wrapper.findAll('.star').map((b) => b.text())).toEqual(['☆', '☆', '☆', '☆', '☆'])
    expect(wrapper.find('.hint').text()).toContain('未評価')
  })

  it('★を押すとその数の評価になる', async () => {
    const wrapper = mount(StarRatingInput, { props: { modelValue: null } })
    await wrapper.findAll('.star')[2]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[3]])
  })

  it('今の評価と同じ★を押すと未評価に戻る', async () => {
    const wrapper = mount(StarRatingInput, { props: { modelValue: 4 } })
    expect(wrapper.findAll('.star.on')).toHaveLength(4)
    await wrapper.findAll('.star')[3]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[null]])
  })
})
