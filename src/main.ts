import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './assets/main.css'
import { initializeTheme } from './composables/useTheme'
import { installPageTitleGuard } from './composables/usePageTitle'
import { installAnalyticsTracking } from './lib/analytics'
import { redirectToCanonicalOrigin } from './lib/publicUrl'

if (!redirectToCanonicalOrigin()) {
  initializeTheme()

  const app = createApp(App)

  app.use(createPinia())
  installAnalyticsTracking(router)
  installPageTitleGuard(router)
  app.use(router)

  app.mount('#app')
}
