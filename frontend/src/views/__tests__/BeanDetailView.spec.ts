import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import BeanDetailView from '../BeanDetailView.vue'
import { routes } from '@/router'
import type { Bean } from '@/types/bean'
import type { BrewRecord } from '@/types/brewRecord'

function makeBean(overrides: Partial<Bean> = {}): Bean {
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

function makeRecord(overrides: Partial<BrewRecord> = {}): BrewRecord {
  return {
    id: 1,
    bean_id: 1,
    brewed_on: '2026-11-20',
    method: 'hand_drip',
    temperature: 'hot',
    dose_amount: null,
    dose_unit: null,
    water_amount: null,
    water_unit: null,
    equipment: null,
    grind_size: null,
    water_temp_c: null,
    brew_time_sec: null,
    taste_memo: null,
    created_at: '2026-11-23T10:00:00',
    updated_at: '2026-11-23T10:00:00',
    ...overrides,
  }
}

interface FakeResponse {
  ok: boolean
  status: number
  body?: unknown
}

const fetchMock = vi.fn<(url: string) => Promise<unknown>>()

/** URL ごとに返すレスポンスを決める（豆1件 / 抽出記録の一覧） */
function respond(bean: FakeResponse, records: FakeResponse) {
  fetchMock.mockImplementation((url: string) => {
    const r = url.endsWith('/brew-records') ? records : bean
    return Promise.resolve({ ok: r.ok, status: r.status, json: () => Promise.resolve(r.body) })
  })
}
const ok = (body: unknown): FakeResponse => ({ ok: true, status: 200, body })

async function mountView(id = '1') {
  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(`/beans/${id}`)
  const wrapper = mount(BeanDetailView, {
    props: { id },
    global: { plugins: [router] },
  })
  await flushPromises()
  return wrapper
}

/** 豆の情報の表（dt → dd） */
function infoRows(wrapper: Awaited<ReturnType<typeof mountView>>) {
  const dts = wrapper.findAll('dl.info dt').map((d) => d.text())
  const dds = wrapper.findAll('dl.info dd').map((d) => d.text())
  return Object.fromEntries(dts.map((dt, i) => [dt, dds[i]]))
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BeanDetailView', () => {
  it('豆の情報をすべて表示する', async () => {
    respond(
      ok(
        makeBean({
          id: 1,
          name: 'エチオピア イルガチェフェ',
          shop: '〇〇珈琲店',
          origin: 'エチオピア イルガチェフェ',
          roast_group: 'medium_dark',
          roast_level: 'city',
          process: 'washed',
          purchased_on: '2026-11-18',
          weight_g: 200,
          price: 1500,
          rating: 4,
          memo: '店員さんのおすすめ',
        }),
      ),
      ok([]),
    )
    const wrapper = await mountView()

    expect(fetchMock.mock.calls.map((c) => c[0]).sort()).toEqual([
      '/api/beans/1',
      '/api/beans/1/brew-records',
    ])
    expect(wrapper.find('h2').text()).toBe('エチオピア イルガチェフェ')
    expect(wrapper.find('.detail-head').text()).toContain('★★★★☆')
    expect(infoRows(wrapper)).toEqual({
      購入店: '〇〇珈琲店',
      産地: 'エチオピア イルガチェフェ',
      焙煎度: 'シティ（中深煎り）',
      精製方法: 'ウォッシュト',
      購入日: '2026-11-18',
      内容量: '200 g',
      価格: '1,500 円',
      メモ: '店員さんのおすすめ',
    })
    // 「← 一覧へ」は豆一覧画面へのリンク
    expect(wrapper.find('a.link').attributes('href')).toBe('/')
    // ［編集］は豆フォーム画面（編集）へのリンク
    expect(wrapper.find('.topbar a.btn').attributes('href')).toBe('/beans/1/edit')
  })

  it('未入力の項目は表示しない', async () => {
    respond(ok(makeBean({ name: '名前だけの豆', roast_group: 'dark' })), ok([]))
    const wrapper = await mountView()

    expect(infoRows(wrapper)).toEqual({ 焙煎度: '深煎り' })
    expect(wrapper.find('.detail-head').text()).toContain('未評価')
  })

  it('項目がすべて未入力のときは表（dl）を出さない', async () => {
    respond(ok(makeBean()), ok([]))
    const wrapper = await mountView()

    expect(wrapper.find('dl.info').exists()).toBe(false)
  })

  it('抽出記録のカードを表示する', async () => {
    respond(
      ok(makeBean()),
      ok([
        makeRecord({
          id: 2,
          brewed_on: '2026-11-20',
          method: 'hand_drip',
          temperature: 'hot',
          dose_amount: 15,
          dose_unit: 'g',
          water_amount: 240,
          water_unit: 'ml',
          taste_memo: '酸味が明るく、後味がすっきり',
        }),
        makeRecord({
          id: 1,
          brewed_on: '2026-11-19',
          method: 'machine',
          temperature: 'ice',
          dose_amount: 2,
          dose_unit: 'cup',
          water_amount: 2,
          water_unit: 'cup',
        }),
      ]),
    )
    const wrapper = await mountView()

    expect(wrapper.find('.section-head h3').text()).toBe('抽出記録（2件）')
    const cards = wrapper.findAll('.record-card')
    expect(cards).toHaveLength(2)

    expect(cards[0]!.text()).toContain('2026-11-20')
    expect(cards[0]!.text()).toContain('ハンドドリップ・ホット')
    expect(cards[0]!.find('.temp-hot').exists()).toBe(true)
    expect(cards[0]!.text()).toContain('豆 15 g ／ 湯 240 ml')
    expect(cards[0]!.find('.memo').text()).toBe('酸味が明るく、後味がすっきり')

    expect(cards[1]!.text()).toContain('コーヒーマシン・アイス')
    expect(cards[1]!.find('.temp-ice').exists()).toBe(true)
    expect(cards[1]!.text()).toContain('豆 2 杯 ／ 湯 2 杯')
    expect(cards[1]!.find('.memo').exists()).toBe(false)

    // カードは抽出記録フォーム画面（編集）へのリンク
    expect(cards[0]!.attributes('href')).toBe('/beans/1/records/2/edit')
    expect(cards[1]!.attributes('href')).toBe('/beans/1/records/1/edit')

    expect(wrapper.find('.empty').exists()).toBe(false)
  })

  it('抽出記録が0件のときは「まだ記録がありません」と表示する', async () => {
    respond(ok(makeBean()), ok([]))
    const wrapper = await mountView()

    expect(wrapper.find('.section-head h3').text()).toBe('抽出記録（0件）')
    expect(wrapper.find('.empty').text()).toBe('まだ記録がありません')
    // ［＋ 記録を追加］は抽出記録フォーム画面（新規）へのリンク
    expect(wrapper.find('.section-head a.btn').attributes('href')).toBe('/beans/1/records/new')
  })

  it('豆が見つからない（404）ときは「豆が見つかりません」と表示する', async () => {
    respond({ ok: false, status: 404 }, { ok: false, status: 404 })
    const wrapper = await mountView('99')

    expect(wrapper.find('.empty').text()).toBe('豆が見つかりません')
    expect(wrapper.find('.bean-info').exists()).toBe(false)
    // 戻るリンクは出す
    expect(wrapper.find('a.link').exists()).toBe(true)
  })

  it('id が数値でないときは API を呼ばずに「豆が見つかりません」と表示する', async () => {
    const wrapper = await mountView('abc')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('.empty').text()).toBe('豆が見つかりません')
  })

  it('取得に失敗したらエラーを表示する', async () => {
    respond({ ok: false, status: 500 }, ok([]))
    const wrapper = await mountView()

    expect(wrapper.find('[role="alert"]').text()).toContain('豆の情報を取得できませんでした')
    expect(wrapper.find('.bean-info').exists()).toBe(false)
  })
})
