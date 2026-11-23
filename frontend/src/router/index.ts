import { createRouter, createWebHistory } from 'vue-router'
import BeanListView from '../views/BeanListView.vue'
import BeanDetailView from '../views/BeanDetailView.vue'
import BeanFormView from '../views/BeanFormView.vue'
import BrewRecordFormView from '../views/BrewRecordFormView.vue'

export const routes = [
  {
    path: '/',
    name: 'bean-list',
    component: BeanListView,
  },
  {
    // 静的なパスは /beans/:id より優先されるので、"new" が id として扱われることはない
    path: '/beans/new',
    name: 'bean-new',
    component: BeanFormView,
  },
  {
    path: '/beans/:id',
    name: 'bean-detail',
    component: BeanDetailView,
    props: true,
  },
  {
    path: '/beans/:id/edit',
    name: 'bean-edit',
    component: BeanFormView,
    props: true,
  },
  {
    path: '/beans/:beanId/records/new',
    name: 'brew-record-new',
    component: BrewRecordFormView,
    props: true,
  },
  {
    path: '/beans/:beanId/records/:recordId/edit',
    name: 'brew-record-edit',
    component: BrewRecordFormView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
