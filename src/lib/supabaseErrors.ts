function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function readString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  return trimmed || null
}

export function getSupabaseErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (typeof error === 'string') {
    return readString(error) ?? fallback
  }

  if (error instanceof Error) {
    return readString(error.message) ?? fallback
  }

  if (!isRecord(error)) {
    return fallback
  }

  const message =
    readString(error.message) ??
    readString(error.error_description) ??
    readString(error.error)
  const details = readString(error.details)
  const hint = readString(error.hint)
  const code = readString(error.code)

  const parts = [
    message,
    details && details !== message ? details : null,
    hint ? `Hint: ${hint}` : null,
  ].filter((part): part is string => Boolean(part))

  if (parts.length > 0) {
    return parts.join(' ')
  }

  if (code) {
    return `${fallback} (${code})`
  }

  return fallback
}
