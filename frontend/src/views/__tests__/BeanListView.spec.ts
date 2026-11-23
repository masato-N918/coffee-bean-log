import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import BeanListView from '../BeanListView.vue'
import type { Bean } from '@/types/bean'

function makeBean(overrides: Partial<Bean>): Bean {
  return {
    id: 1,
    name: '豆',
    shop: null,
    origin: null,
    roast_group: null,
    roast_level: null,
    process: null,
    purchased_on: null,
    weight_g: null,
    price: null,
    rating: null,
    memo: null,
    created_at: '2026-11-23T10:00:00',
    updated_at: '2026-11-23T10:00:00',
    ...overrides,
  }
}

function mockFetch(response: { ok: boolean; status?: number; body?: unknown }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: response.ok,
      status: response.status ?? 200,
      json: () => Promise.resolve(response.body),
    }),
  )
}

async function mountView() {
  const wrapper = mount(BeanListView)
  await flushPromises()
  return wrapper
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BeanListView', () => {
  it('豆の一覧と件数を表示する', async () => {
    mockFetch({
      ok: true,
      body: [
        makeBean({
          id: 1,
          name: 'エチオピア イルガチェフェ',
          origin: 'エチオピア',
          roast_group: 'medium_dark',
          roast_level: 'city',
          rating: 4,
        }),
        makeBean({ id: 2, name: 'パイクプレイス ロースト', roast_group: 'medium_dark' }),
      ],
    })
    const wrapper = await mountView()

    expect(fetch).toHaveBeenCalledWith('/api/beans')
    expect(wrapper.find('.count').text()).toBe('2件')

    const cards = wrapper.findAll('.bean-card')
    expect(cards).toHaveLength(2)
    expect(cards[0]!.text()).toContain('エチオピア イルガチェフェ')
    expect(cards[0]!.text()).toContain('★★★★☆')
    expect(cards[0]!.text()).toContain('エチオピア ／ シティ（中深煎り）')
    // 未評価・産地なしの豆
    expect(cards[1]!.text()).toContain('未評価')
    expect(cards[1]!.text()).toContain('中深煎り')
    expect(cards[1]!.text()).not.toContain('／')
  })

  it('豆が0件のときは「まだ豆が登録されていません」と表示する', async () => {
    mockFetch({ ok: true, body: [] })
    const wrapper = await mountView()

    expect(wrapper.find('.empty').text()).toBe('まだ豆が登録されていません')
    expect(wrapper.find('.count').exists()).toBe(false)
  })

  it('取得に失敗したらエラーを表示する', async () => {
    mockFetch({ ok: false, status: 500 })
    const wrapper = await mountView()

    expect(wrapper.find('[role="alert"]').text()).toContain('豆の一覧を取得できませんでした')
  })
})
