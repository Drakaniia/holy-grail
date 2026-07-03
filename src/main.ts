import { createApp } from 'vue'
import { createPinia } from 'pinia'
import posthog from 'posthog-js'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import { initializeTheme } from './composables/useTheme'
import { installPageTitleGuard } from './composables/usePageTitle'
import { installAnalyticsTracking } from './lib/analytics'
import { redirectToCanonicalOrigin } from './lib/publicUrl'

posthog.init(import.meta.env.VITE_POSTHOG_PROJECT_TOKEN || '', {
  api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  defaults: '2026-01-30',
})

if (!redirectToCanonicalOrigin()) {
  initializeTheme()

  const app = createApp(App)

  app.config.errorHandler = (err) => {
    posthog.captureException(err)
  }

  app.use(createPinia())
  installAnalyticsTracking(router)
  installPageTitleGuard(router)
  app.use(router)

  app.mount('#app')
}
