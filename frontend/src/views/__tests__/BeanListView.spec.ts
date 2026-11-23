import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'

import BeanListView from '../BeanListView.vue'
import { routes } from '@/router'
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

const fetchMock = vi.fn<(url: string) => Promise<unknown>>()

function respond(body: unknown, ok = true, status = 200) {
  fetchMock.mockResolvedValue({ ok, status, json: () => Promise.resolve(body) })
}

/** 最後に呼ばれた fetch の URL のクエリ */
function lastQuery() {
  const url = fetchMock.mock.lastCall?.[0] ?? ''
  return new URLSearchParams(url.split('?')[1] ?? '')
}

async function mountView() {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push('/')
  const wrapper = mount(BeanListView, { attachTo: document.body, global: { plugins: [router] } })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.body.innerHTML = ''
})

describe('BeanListView', () => {
  it('豆の一覧と件数を表示する', async () => {
    respond([
      makeBean({
        id: 1,
        name: 'エチオピア イルガチェフェ',
        origin: 'エチオピア',
        roast_group: 'medium_dark',
        roast_level: 'city',
        rating: 4,
      }),
      makeBean({ id: 2, name: 'パイクプレイス ロースト', roast_group: 'medium_dark' }),
    ])
    const wrapper = await mountView()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.lastCall?.[0]).toBe('/api/beans?sort=newest')
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
    // カードは豆詳細画面へのリンク
    expect(cards[0]!.attributes('href')).toBe('/beans/1')
    expect(cards[1]!.attributes('href')).toBe('/beans/2')
  })

  it('条件なしで0件のときは「まだ豆が登録されていません」と表示する', async () => {
    respond([])
    const wrapper = await mountView()

    expect(wrapper.find('.empty').text()).toBe('まだ豆が登録されていません')
    expect(wrapper.find('.count').exists()).toBe(false)
    // 絞り込みパネルは0件でも表示する
    expect(wrapper.find('.filters').exists()).toBe(true)
  })

  it('取得に失敗したらエラーを表示する', async () => {
    respond(undefined, false, 500)
    const wrapper = await mountView()

    expect(wrapper.find('[role="alert"]').text()).toContain('豆の一覧を取得できませんでした')
  })

  it('評価・並び順を変えると、その条件で取り直す', async () => {
    respond([])
    const wrapper = await mountView()

    await wrapper.find('select').setValue('3')
    await flushPromises()
    expect(lastQuery().get('min_rating')).toBe('3')

    await wrapper.find('input[type="radio"][value="rating"]').setValue()
    await flushPromises()
    expect(lastQuery().get('sort')).toBe('rating')
    expect(lastQuery().get('min_rating')).toBe('3')
  })

  it('焙煎度を選ぶと呼び方・8段階の条件で取り直す', async () => {
    respond([])
    const wrapper = await mountView()

    await wrapper.find('input[value="g:light"]').setValue(true)
    await wrapper.find('input[value="l:city"]').setValue(true)
    await flushPromises()
    expect(lastQuery().getAll('roast_group')).toEqual(['light'])
    expect(lastQuery().getAll('roast_level')).toEqual(['city'])
    expect(wrapper.find('.multi summary').text()).toBe('浅煎り, シティ')
  })

  it('産地は入力が止まってから取り直す', async () => {
    vi.useFakeTimers()
    respond([])
    const wrapper = await mountView()
    fetchMock.mockClear()

    await wrapper.find('input[type="text"]').setValue('ケニア')
    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(lastQuery().get('origin')).toBe('ケニア')
  })

  it('条件ありで0件のときは「条件に合う豆がありません」と表示し、［クリア］で条件を戻す', async () => {
    respond([])
    const wrapper = await mountView()

    await wrapper.find('select').setValue('5')
    await flushPromises()
    expect(wrapper.find('.count').text()).toBe('0件')
    const empties = wrapper.findAll('.empty')
    expect(empties[empties.length - 1]!.text()).toBe('条件に合う豆がありません')

    await wrapper.find('.between .btn').trigger('click')
    await flushPromises()
    expect(lastQuery().get('min_rating')).toBeNull()
    expect((wrapper.find('select').element as HTMLSelectElement).selectedIndex).toBe(0)
    expect(wrapper.find('.empty').text()).toBe('まだ豆が登録されていません')
  })
})
