export type AuthMode = 'login' | 'signup'

export interface AuthCredentials {
  email: string
  password: string
  fullName?: string
}
