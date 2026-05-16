import { createRouter, createWebHistory } from 'vue-router'
import SkillsPage from '@/pages/SkillsPage.vue'
import SkillDetail from '@/pages/SkillDetail.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/skills',
    },
    {
      path: '/skills',
      name: 'skills',
      component: SkillsPage,
    },
    {
      path: '/skills/:slug',
      name: 'skill-detail',
      component: SkillDetail,
    },
  ],
})

export default router
