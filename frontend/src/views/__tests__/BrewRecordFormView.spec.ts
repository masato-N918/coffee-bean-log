import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import BrewRecordFormView from '../BrewRecordFormView.vue'
import { todayString } from '@/forms/brewRecordForm'
import { routes } from '@/router'
import type { Bean } from '@/types/bean'
import type { BrewRecord } from '@/types/brewRecord'

function makeBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 5,
    name: 'エチオピア イルガチェフェ',
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
    id: 8,
    bean_id: 5,
    brewed_on: '2026-11-20',
    method: 'machine',
    temperature: 'ice',
    dose_amount: 2,
    dose_unit: 'cup',
    water_amount: 240,
    water_unit: 'ml',
    equipment: null,
    grind_size: null,
    water_temp_c: null,
    brew_time_sec: null,
    taste_memo: 'すっきり',
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
const ok = (body?: unknown, status = 200): FakeResponse => ({ ok: true, status, body })

const fetchMock = vi.fn<(url: string, init?: RequestInit) => Promise<unknown>>()

/** 「メソッド URL」ごとに返すレスポンスを決める（決めていないものは 500） */
function respond(table: Record<string, FakeResponse>) {
  fetchMock.mockImplementation((url, init) => {
    const r = table[`${init?.method ?? 'GET'} ${url}`] ?? { ok: false, status: 500 }
    return Promise.resolve({ ok: r.ok, status: r.status, json: () => Promise.resolve(r.body) })
  })
}

/** 呼ばれた fetch のうち、指定したメソッドのもの */
function callsOf(method: string) {
  return fetchMock.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === method)
}

let router: Router

async function mountView(beanId: string, recordId?: string) {
  router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(
    recordId ? `/beans/${beanId}/records/${recordId}/edit` : `/beans/${beanId}/records/new`,
  )
  const wrapper = mount(BrewRecordFormView, {
    props: recordId ? { beanId, recordId } : { beanId },
    global: { plugins: [router] },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

type Wrapper = Awaited<ReturnType<typeof mountView>>
const value = (wrapper: Wrapper, sel: string) =>
  (wrapper.find(sel).element as HTMLInputElement | HTMLSelectElement).value
const detailVisible = (wrapper: Wrapper) =>
  (wrapper.find('.details-box').element as HTMLElement).style.display !== 'none'

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('BrewRecordFormView（新規モード）', () => {
  beforeEach(() => respond({ 'GET /api/beans/5': ok(makeBean()) }))

  it('見出しと豆の名前を出し、初期値は今日・ホット。削除ボタンは出さない', async () => {
    const wrapper = await mountView('5')

    expect(wrapper.find('h1').text()).toBe('記録を追加')
    expect(wrapper.find('.sub').text()).toBe('エチオピア イルガチェフェ')
    expect(value(wrapper, 'input[name="brewed_on"]')).toBe(todayString())
    expect(value(wrapper, 'select[name="method"]')).toBe('')
    expect(wrapper.find('.segmented label.on').text()).toBe('ホット')
    expect(value(wrapper, 'select[name="dose_unit"]')).toBe('g')
    expect(value(wrapper, 'select[name="water_unit"]')).toBe('ml')
    expect(detailVisible(wrapper)).toBe(false)
    expect(wrapper.find('.btn.danger').exists()).toBe(false)
    expect(wrapper.find('a.cancel').attributes('href')).toBe('/beans/5')
  })

  it('［詳細（任意）］で詳細の入力欄を開閉する', async () => {
    const wrapper = await mountView('5')
    const toggle = wrapper.find('button.toggle')

    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')
    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(detailVisible(wrapper)).toBe(true)
    await toggle.trigger('click')
    expect(detailVisible(wrapper)).toBe(false)
  })

  it('抽出方法が空のまま保存するとエラーを表示し、API は呼ばない', async () => {
    const wrapper = await mountView('5')

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(callsOf('POST')).toHaveLength(0)
    expect(wrapper.find('.has-error .err').text()).toBe('抽出方法を選択してください')
    expect(wrapper.find('.form-error').text()).toContain('入力内容に誤りがあります')
  })

  it('詳細の欄にエラーがあるときは詳細を自動で開く', async () => {
    const wrapper = await mountView('5')

    await wrapper.find('select[name="method"]').setValue('hand_drip')
    await wrapper.find('input[name="water_temp_c"]').setValue('120')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(detailVisible(wrapper)).toBe(true)
    expect(wrapper.find('.details-box .err').text()).toBe('50〜100の整数で入力してください')
  })

  it('入力して保存すると POST し、豆詳細画面へ移る', async () => {
    respond({
      'GET /api/beans/5': ok(makeBean()),
      'POST /api/beans/5/brew-records': ok(makeRecord(), 201),
    })
    const wrapper = await mountView('5')

    await wrapper.find('input[name="brewed_on"]').setValue('2026-11-22')
    await wrapper.find('select[name="method"]').setValue('machine')
    await wrapper.find('input[name="temperature"][value="ice"]').setValue(true)
    await wrapper.find('input[name="dose_amount"]').setValue('2')
    await wrapper.find('select[name="dose_unit"]').setValue('cup')
    await wrapper.find('textarea[name="taste_memo"]').setValue(' すっきり ')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [[url, init]] = callsOf('POST') as [[string, RequestInit]]
    expect(url).toBe('/api/beans/5/brew-records')
    expect(JSON.parse(init.body as string)).toEqual({
      brewed_on: '2026-11-22',
      method: 'machine',
      temperature: 'ice',
      dose_amount: 2,
      dose_unit: 'cup',
      water_amount: null,
      water_unit: null,
      taste_memo: 'すっきり',
      equipment: null,
      grind_size: null,
      water_temp_c: null,
      brew_time_sec: null,
    })
    expect(router.currentRoute.value.fullPath).toBe('/beans/5')
  })

  it('保存に失敗したらフォームにエラーを表示し、画面は移らない', async () => {
    const wrapper = await mountView('5')

    await wrapper.find('select[name="method"]').setValue('hand_drip')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-error').text()).toBe('抽出記録を保存できませんでした（500）')
    expect(router.currentRoute.value.fullPath).toBe('/beans/5/records/new')
  })

  it('豆が見つからない（404）ときは「豆が見つかりません」と表示する', async () => {
    respond({ 'GET /api/beans/5': { ok: false, status: 404 } })
    const wrapper = await mountView('5')

    expect(wrapper.find('.empty').text()).toBe('豆が見つかりません')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('豆の id が数値でないときは API を呼ばずに「豆が見つかりません」と表示する', async () => {
    const wrapper = await mountView('abc')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('.empty').text()).toBe('豆が見つかりません')
  })
})

describe('BrewRecordFormView（編集モード）', () => {
  function respondRecord(record: BrewRecord = makeRecord(), extra: Record<string, FakeResponse> = {}) {
    respond({
      'GET /api/beans/5': ok(makeBean()),
      [`GET /api/brew-records/${record.id}`]: ok(record),
      ...extra,
    })
  }

  it('登録済みの値を入力欄に入れる。詳細が空なら閉じておく', async () => {
    respondRecord()
    const wrapper = await mountView('5', '8')

    expect(wrapper.find('h1').text()).toBe('記録を編集')
    expect(wrapper.find('.sub').text()).toBe('エチオピア イルガチェフェ')
    expect(value(wrapper, 'input[name="brewed_on"]')).toBe('2026-11-20')
    expect(value(wrapper, 'select[name="method"]')).toBe('machine')
    expect(wrapper.find('.segmented label.on').text()).toBe('アイス')
    expect(value(wrapper, 'input[name="dose_amount"]')).toBe('2')
    expect(value(wrapper, 'select[name="dose_unit"]')).toBe('cup')
    expect(value(wrapper, 'input[name="water_amount"]')).toBe('240')
    expect(value(wrapper, 'textarea[name="taste_memo"]')).toBe('すっきり')
    expect(detailVisible(wrapper)).toBe(false)
    expect(wrapper.find('a.cancel').attributes('href')).toBe('/beans/5')
  })

  it('詳細に値があるときは最初から開いておく', async () => {
    respondRecord(makeRecord({ grind_size: 'medium_fine', water_temp_c: 90 }))
    const wrapper = await mountView('5', '8')

    expect(detailVisible(wrapper)).toBe(true)
    expect(value(wrapper, 'select[name="grind_size"]')).toBe('medium_fine')
    expect(value(wrapper, 'input[name="water_temp_c"]')).toBe('90')
  })

  it('保存すると PUT し、豆詳細画面へ移る', async () => {
    respondRecord(makeRecord(), { 'PUT /api/brew-records/8': ok(makeRecord()) })
    const wrapper = await mountView('5', '8')

    await wrapper.find('input[name="dose_amount"]').setValue('')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [[url, init]] = callsOf('PUT') as [[string, RequestInit]]
    expect(url).toBe('/api/brew-records/8')
    expect(JSON.parse(init.body as string)).toMatchObject({
      method: 'machine',
      temperature: 'ice',
      dose_amount: null,
      dose_unit: null,
      water_amount: 240,
      water_unit: 'ml',
    })
    expect(router.currentRoute.value.fullPath).toBe('/beans/5')
  })

  it('［削除］で確認ダイアログを開き、キャンセルで閉じる', async () => {
    respondRecord()
    const wrapper = await mountView('5', '8')

    await wrapper.find('.actions .btn.danger').trigger('click')
    const dialog = wrapper.find('dialog')
    expect(dialog.text()).toContain('この抽出記録を削除しますか？')

    await dialog.find('.btn:not(.danger)').trigger('click')
    expect(wrapper.find('dialog').exists()).toBe(false)
    expect(callsOf('DELETE')).toHaveLength(0)
  })

  it('確認ダイアログで［削除］すると DELETE し、豆詳細画面へ移る', async () => {
    respondRecord(makeRecord(), { 'DELETE /api/brew-records/8': ok(undefined, 204) })
    const wrapper = await mountView('5', '8')

    await wrapper.find('.actions .btn.danger').trigger('click')
    await wrapper.find('dialog .btn.danger').trigger('click')
    await flushPromises()

    expect(callsOf('DELETE').map(([url]) => url)).toEqual(['/api/brew-records/8'])
    expect(router.currentRoute.value.fullPath).toBe('/beans/5')
  })

  it('記録が見つからない（404）ときは「抽出記録が見つかりません」と表示する', async () => {
    respond({
      'GET /api/beans/5': ok(makeBean()),
      'GET /api/brew-records/99': { ok: false, status: 404 },
    })
    const wrapper = await mountView('5', '99')

    expect(wrapper.find('.empty').text()).toBe('抽出記録が見つかりません')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('別の豆の記録を開こうとしたときは「抽出記録が見つかりません」と表示する', async () => {
    respondRecord(makeRecord({ bean_id: 6 }))
    const wrapper = await mountView('5', '8')

    expect(wrapper.find('.empty').text()).toBe('抽出記録が見つかりません')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('記録の id が数値でないときは API を呼ばずに「抽出記録が見つかりません」と表示する', async () => {
    const wrapper = await mountView('5', 'abc')

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('.empty').text()).toBe('抽出記録が見つかりません')
  })
})
