const DEFAULT_PUBLIC_SITE_URL = 'https://holy-grail-eta.vercel.app'
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]'])

function normalizePublicSiteOrigin(value: string | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return ''
  }

  const withProtocol = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(withProtocol).origin
  } catch {
    return ''
  }
}

export const publicSiteOrigin = normalizePublicSiteOrigin(
  import.meta.env.VITE_PUBLIC_SITE_URL || import.meta.env.VITE_SITE_URL || DEFAULT_PUBLIC_SITE_URL,
)

export function isLocalOrigin(origin: string) {
  try {
    return LOCAL_HOSTNAMES.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

export function getCurrentOrigin() {
  return typeof window === 'undefined' ? '' : window.location.origin
}

export function getAuthRedirectOrigin() {
  const currentOrigin = getCurrentOrigin()

  if (!currentOrigin) {
    return publicSiteOrigin
  }

  if (isLocalOrigin(currentOrigin)) {
    return currentOrigin
  }

  return publicSiteOrigin || currentOrigin
}

export function redirectToCanonicalOrigin() {
  if (typeof window === 'undefined' || !publicSiteOrigin) {
    return false
  }

  const currentOrigin = window.location.origin

  if (isLocalOrigin(currentOrigin) || currentOrigin === publicSiteOrigin) {
    return false
  }

  const target = new URL(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
    `${publicSiteOrigin}/`,
  )

  window.location.replace(target.toString())
  return true
}
