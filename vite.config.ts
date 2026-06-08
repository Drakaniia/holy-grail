import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    vue(),
    vueJsx(),
  ]

  if (mode !== 'production') {
    plugins.push(vueDevTools())
  }

  return {
    build: {
      chunkSizeWarningLimit: 700,
      rolldownOptions: {
        checks: {
          pluginTimings: false,
        },
      },
    },
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
