import type { Provider } from '@supabase/supabase-js'

export type AuthMode = 'login' | 'signup'
export type AuthProvider = Extract<Provider, 'github' | 'google'>

export interface AuthCredentials {
  email: string
  password: string
  fullName?: string
}
