/** Compact number rendering shared by every card, hero and stat row: 999 → "999", 1500 → "1.5k". */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en', {
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(value)
}

/** Google favicon service URL for a site, or `''` when there is no website to ask about. */
export function faviconUrl(website: string, size = 64): string {
  if (!website) return ''

  try {
    const hostname = new URL(website).hostname.replace(/^www\./, '')
    return hostname ? `https://www.google.com/s2/favicons?domain=${hostname}&sz=${size}` : ''
  } catch {
    return ''
  }
}
