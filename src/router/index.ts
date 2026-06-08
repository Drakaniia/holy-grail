import { createRouter, createWebHistory } from 'vue-router'
import SitesHomePage from '@/pages/SitesHomePage.vue'

const AccountPage = () => import('@/pages/AccountPage.vue')
const AdminPage = () => import('@/pages/AdminPage.vue')
const AuthCallbackPage = () => import('@/pages/AuthCallbackPage.vue')
const AuthPage = () => import('@/pages/AuthPage.vue')
const BookmarksPage = () => import('@/pages/BookmarksPage.vue')
const ChangelogPage = () => import('@/pages/ChangelogPage.vue')
const DocumentationPage = () => import('@/pages/DocumentationPage.vue')
const EditProfilePage = () => import('@/pages/EditProfilePage.vue')
const HomePage = () => import('@/pages/HomePage.vue')
const NotFoundPage = () => import('@/pages/NotFoundPage.vue')
const SiteDetail = () => import('@/pages/SiteDetail.vue')
const SitesPage = () => import('@/pages/SitesPage.vue')
const SettingsPage = () => import('@/pages/SettingsPage.vue')
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
      name: 'sites-home',
      component: SitesHomePage,
    },
    {
      path: '/sites/platforms',
      redirect: '/sites',
    },
    {
      path: '/sites/cli-tools',
      redirect: '/sites/development/cli-tools',
    },
    {
      path: '/sites/ui-libraries',
      redirect: '/sites/development/ui-libraries',
    },
    {
      path: '/sites/:category(ai|design|development|watch|downloads)/:subcategory?',
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
      path: '/account/edit',
      name: 'account-edit',
      component: EditProfilePage,
      meta: { requiresAuth: true },
    },
    {
      path: '/bookmarks',
      name: 'bookmarks',
      component: BookmarksPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/settings',
      name: 'settings',
      component: SettingsPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/publish',
      alias: '/submit',
      name: 'publish',
      component: SubmitPage,
    },
    {
      path: '/docs',
      name: 'docs',
      component: DocumentationPage,
    },
    {
      path: '/changelog',
      name: 'changelog',
      component: ChangelogPage,
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFoundPage,
    },
  ],
})

router.beforeEach(async (to) => {
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

  if (!to.meta.requiresAuth && !to.meta.guestOnly) {
    return
  }

  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()

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
