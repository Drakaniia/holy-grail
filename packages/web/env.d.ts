/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
  readonly VITE_SUPABASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
