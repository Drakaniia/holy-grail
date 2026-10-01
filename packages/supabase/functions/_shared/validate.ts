export function readString(value: unknown, maxLength: number) {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().slice(0, maxLength)
}

export function normalizeUrl(value: string) {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null
    }

    if (!parsed.hostname || parsed.username || parsed.password) {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}
