import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const AccountPage = () => import('@/pages/AccountPage.vue')
const AdminPage = () => import('@/pages/AdminPage.vue')
const AuthCallbackPage = () => import('@/pages/AuthCallbackPage.vue')
const AuthPage = () => import('@/pages/AuthPage.vue')
const BookmarksPage = () => import('@/pages/BookmarksPage.vue')
const HomePage = () => import('@/pages/HomePage.vue')
const SiteDetail = () => import('@/pages/SiteDetail.vue')
const SitesPage = () => import('@/pages/SitesPage.vue')
const SkillDetail = () => import('@/pages/SkillDetail.vue')
const SkillsPage = () => import('@/pages/SkillsPage.vue')
const SubmitPage = () => import('@/pages/SubmitPage.vue')

function hasStringQueryValue(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

function hasOAuthCallbackQuery(query: Record<string, unknown>) {
  return (
    hasStringQueryValue(query.code) ||
    hasStringQueryValue(query.error) ||
    hasStringQueryValue(query.error_description)
  )
}

function getSafeNextPath(value: unknown) {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  return '/account'
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/sites',
      redirect: '/sites/platforms',
    },
    {
      path: '/sites/:category(platforms|ai|design|development|watch|downloads|cli-tools|ui-libraries)/:subcategory?',
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
    {
      path: '/login',
      name: 'login',
      component: AuthPage,
      meta: { authMode: 'login', guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: AuthPage,
      meta: { authMode: 'signup', guestOnly: true },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: AuthCallbackPage,
    },
    {
      path: '/account',
      name: 'account',
      component: AccountPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: BookmarksPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/submit',
      name: 'submit',
      component: SubmitPage,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.name === 'auth-callback') {
    return
  }

  if (hasOAuthCallbackQuery(to.query)) {
    return {
      name: 'auth-callback',
      query: {
        ...to.query,
        next: getSafeNextPath(to.query.next),
      },
      replace: true,
    }
  }

  await auth.initialize()

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  }

  if (to.meta.guestOnly && auth.isAuthenticated) {
    return { name: 'account' }
  }
})

export default router
