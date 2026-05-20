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
      redirect: '/sites/platforms',
    },
    {
      path: '/sites',
      redirect: '/sites/platforms',
    },
    {
      path: '/sites/:category(platforms|ai|design|cli-tools|ui-libraries)/:subcategory?',
      name: 'sites-category',
      component: SitesPage,
    },
    {
      path: '/sites/:slug',
      name: 'site-detail',
      component: SiteDetail,
    },
    {
      path: '/skills',
      redirect: '/skills/skills',
    },
    {
      path: '/skills/:category(skills|design)',
      name: 'skills-category',
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
