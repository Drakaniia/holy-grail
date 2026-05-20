import {
  createRouter,
  createWebHistory,
  type LocationQueryRaw,
  type RouteLocationNormalized,
} from 'vue-router'
import SkillsPage from '@/pages/SkillsPage.vue'
import SkillDetail from '@/pages/SkillDetail.vue'
import SitesPage from '@/pages/SitesPage.vue'
import SiteDetail from '@/pages/SiteDetail.vue'
import AccountPage from '@/pages/AccountPage.vue'
import AdminPage from '@/pages/AdminPage.vue'
import AuthPage from '@/pages/AuthPage.vue'
import BookmarksPage from '@/pages/BookmarksPage.vue'
import SubmitPage from '@/pages/SubmitPage.vue'
import { useAuthStore } from '@/stores/auth'

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
      path: '/sites/:category(platforms|ai|design|development|cli-tools|ui-libraries)/:subcategory?',
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

const OAUTH_CALLBACK_QUERY_KEYS = ['code', 'error', 'error_code', 'error_description', 'state']
const OAUTH_CALLBACK_HASH_KEYS = ['access_token', 'error', 'error_description', 'refresh_token']

function getCleanOAuthCallbackRoute(to: RouteLocationNormalized) {
  const query: LocationQueryRaw = {}
  let hasCallbackParam = false

  for (const [key, value] of Object.entries(to.query)) {
    if (OAUTH_CALLBACK_QUERY_KEYS.includes(key)) {
      hasCallbackParam = true
      continue
    }

    query[key] = value
  }

  const hasCallbackHash = OAUTH_CALLBACK_HASH_KEYS.some((key) => to.hash.includes(key))

  if (!hasCallbackParam && !hasCallbackHash) {
    return null
  }

  return {
    path: to.path,
    query,
    hash: hasCallbackHash ? '' : to.hash,
  }
}

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  const oauthRedirect = await auth.completeOAuthRedirect()
  if (oauthRedirect.handled) {
    const cleanRoute = getCleanOAuthCallbackRoute(to)

    if (cleanRoute) {
      return cleanRoute
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
