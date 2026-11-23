import { createRouter, createWebHistory } from 'vue-router'
import BeanListView from '../views/BeanListView.vue'
import BeanDetailView from '../views/BeanDetailView.vue'

export const routes = [
  {
    path: '/',
    name: 'bean-list',
    component: BeanListView,
  },
  {
    path: '/beans/:id',
    name: 'bean-detail',
    component: BeanDetailView,
    props: true,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
