import { createRouter, createWebHistory } from 'vue-router'
import BeanListView from '../views/BeanListView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'bean-list',
      component: BeanListView,
    },
  ],
})

export default router
