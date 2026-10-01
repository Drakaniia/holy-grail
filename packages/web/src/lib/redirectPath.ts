/**
 * Open-redirect guard: only same-origin absolute paths survive, anything else lands on /account.
 * Used by the OAuth flows (stores/auth) and by the router's `?next=` callback guard.
 */
export function getRedirectPath(value: unknown): string {
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')) {
    return value
  }

  return '/account'
}
