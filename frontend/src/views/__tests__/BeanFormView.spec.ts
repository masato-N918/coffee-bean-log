import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import BeanFormView from '../BeanFormView.vue'
import { routes } from '@/router'
import type { Bean } from '@/types/bean'

function makeBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 5,
    name: 'エチオピア イルガチェフェ',
    shop: '〇〇珈琲店',
    origin: null,
    roast_group: 'medium_dark',
    roast_level: 'city',
    process: 'washed',
    purchased_on: '2026-11-18',
    weight_g: 200,
    price: 1500,
    rating: 4,
    memo: null,
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

async function mountView(id?: string) {
  router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(id ? `/beans/${id}/edit` : '/beans/new')
  const wrapper = mount(BeanFormView, {
    props: id ? { id } : {},
    global: { plugins: [router] },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

describe('BeanFormView（新規モード）', () => {
  it('見出しは「豆を登録」で、削除ボタンは出さない。キャンセルは一覧へ', async () => {
    const wrapper = await mountView()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('h1').text()).toBe('豆を登録')
    expect(wrapper.find('.btn.danger').exists()).toBe(false)
    expect(wrapper.find('a.cancel').attributes('href')).toBe('/')
  })

  it('名前が空のまま保存するとエラーを表示し、API は呼ばない', async () => {
    const wrapper = await mountView()

    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(wrapper.find('.has-error .err').text()).toBe('豆の名前を入力してください')
    expect(wrapper.find('.form-error').text()).toContain('入力内容に誤りがあります')
  })

  it('入力して保存すると POST し、登録した豆の詳細画面へ移る', async () => {
    respond({ 'POST /api/beans': ok(makeBean({ id: 42 }), 201) })
    const wrapper = await mountView()

    await wrapper.find('input[name="name"]').setValue('  ケニア ニエリ ')
    await wrapper.find('select[name="roast"]').setValue('g:light')
    await wrapper.find('input[name="weight_g"]').setValue('250')
    await wrapper.findAll('.star')[2]!.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [[url, init]] = callsOf('POST') as [[string, RequestInit]]
    expect(url).toBe('/api/beans')
    expect(JSON.parse(init.body as string)).toMatchObject({
      name: 'ケニア ニエリ',
      roast_group: 'light',
      roast_level: null,
      weight_g: 250,
      rating: 3,
      shop: null,
    })
    expect(router.currentRoute.value.fullPath).toBe('/beans/42')
  })

  it('保存に失敗したらフォームにエラーを表示し、画面は移らない', async () => {
    respond({ 'POST /api/beans': { ok: false, status: 500 } })
    const wrapper = await mountView()

    await wrapper.find('input[name="name"]').setValue('豆')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.form-error').text()).toBe('豆を保存できませんでした（500）')
    expect(router.currentRoute.value.fullPath).toBe('/beans/new')
  })
})

describe('BeanFormView（編集モード）', () => {
  function respondBean(records: unknown[] = [], extra: Record<string, FakeResponse> = {}) {
    respond({
      'GET /api/beans/5': ok(makeBean()),
      'GET /api/beans/5/brew-records': ok(records),
      ...extra,
    })
  }

  it('登録済みの値を入力欄に入れる。キャンセルは詳細へ', async () => {
    respondBean()
    const wrapper = await mountView('5')

    expect(wrapper.find('h1').text()).toBe('豆を編集')
    const value = (sel: string) =>
      (wrapper.find(sel).element as HTMLInputElement | HTMLSelectElement).value
    expect(value('input[name="name"]')).toBe('エチオピア イルガチェフェ')
    expect(value('input[name="shop"]')).toBe('〇〇珈琲店')
    expect(value('select[name="roast"]')).toBe('l:city')
    expect(value('select[name="process"]')).toBe('washed')
    expect(value('input[name="purchased_on"]')).toBe('2026-11-18')
    expect(value('input[name="weight_g"]')).toBe('200')
    expect(wrapper.findAll('.star.on')).toHaveLength(4)
    expect(wrapper.find('a.cancel').attributes('href')).toBe('/beans/5')
  })

  it('保存すると PUT し、詳細画面へ移る', async () => {
    respondBean([], { 'PUT /api/beans/5': ok(makeBean({ name: '新しい名前' })) })
    const wrapper = await mountView('5')

    await wrapper.find('input[name="name"]').setValue('新しい名前')
    await wrapper.find('input[name="price"]').setValue('')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    const [[url, init]] = callsOf('PUT') as [[string, RequestInit]]
    expect(url).toBe('/api/beans/5')
    expect(JSON.parse(init.body as string)).toMatchObject({
      name: '新しい名前',
      roast_group: 'medium_dark',
      roast_level: 'city',
      price: null,
    })
    expect(router.currentRoute.value.fullPath).toBe('/beans/5')
  })

  it('［削除］で確認ダイアログに抽出記録の件数を出し、キャンセルで閉じる', async () => {
    respondBean([{ id: 1 }, { id: 2 }, { id: 3 }])
    const wrapper = await mountView('5')

    await wrapper.find('.actions .btn.danger').trigger('click')
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.text()).toContain('この豆を削除しますか？')
    expect(dialog.text()).toContain('抽出記録（3件）も一緒に削除されます。')

    await dialog.find('.btn:not(.danger)').trigger('click')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(callsOf('DELETE')).toHaveLength(0)
  })

  it('抽出記録が0件のときは件数の行を出さない', async () => {
    respondBean([])
    const wrapper = await mountView('5')

    await wrapper.find('.actions .btn.danger').trigger('click')
    expect(wrapper.find('[role="dialog"]').text()).not.toContain('抽出記録')
  })

  it('確認ダイアログで［削除］すると DELETE し、一覧へ移る', async () => {
    respondBean([], { 'DELETE /api/beans/5': ok(undefined, 204) })
    const wrapper = await mountView('5')

    await wrapper.find('.actions .btn.danger').trigger('click')
    await wrapper.find('[role="dialog"] .btn.danger').trigger('click')
    await flushPromises()

    expect(callsOf('DELETE').map(([url]) => url)).toEqual(['/api/beans/5'])
    expect(router.currentRoute.value.fullPath).toBe('/')
  })

  it('豆が見つからない（404）ときは「豆が見つかりません」と表示する', async () => {
    respond({
      'GET /api/beans/99': { ok: false, status: 404 },
      'GET /api/beans/99/brew-records': { ok: false, status: 404 },
    })
    const wrapper = await mountView('99')

    expect(wrapper.find('.empty').text()).toBe('豆が見つかりません')
    expect(wrapper.find('form').exists()).toBe(false)
  })
})
