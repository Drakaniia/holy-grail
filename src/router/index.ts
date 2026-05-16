import { createRouter, createWebHistory } from 'vue-router'
import SkillsPage from '@/pages/SkillsPage.vue'
import SkillDetail from '@/pages/SkillDetail.vue'
import SitesPage from '@/pages/SitesPage.vue'
import SiteDetail from '@/pages/SiteDetail.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/sites',
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
    {
      path: '/sites',
      name: 'sites',
      component: SitesPage,
    },
    {
      path: '/sites/:slug',
      name: 'site-detail',
      component: SiteDetail,
    },
  ],
})

export default router
