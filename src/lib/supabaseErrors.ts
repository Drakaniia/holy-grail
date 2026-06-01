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

function getErrorName(error: unknown): string | null {
  if (!isRecord(error)) {
    return null
  }

  return readString(error.name)
}

function getErrorContext(error: unknown): Response | null {
  if (!isRecord(error) || !('context' in error)) {
    return null
  }

  const context = error.context
  return context instanceof Response ? context : null
}

async function readResponseErrorMessage(response: Response) {
  const contentType = response.headers.get('Content-Type') ?? ''

  if (contentType.includes('application/json')) {
    const body = await response.clone().json().catch(() => null)

    if (isRecord(body)) {
      return (
        readString(body.error) ??
        readString(body.message) ??
        readString(body.error_description)
      )
    }
  }

  return readString(await response.clone().text().catch(() => ''))
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

export async function getSupabaseFunctionErrorMessage(
  error: unknown,
  fallback = 'Request failed.',
): Promise<string> {
  const response = getErrorContext(error)

  if (response) {
    const responseMessage = await readResponseErrorMessage(response)
    if (responseMessage) {
      return responseMessage
    }

    if (response.status === 404) {
      return 'Supabase Edge Function was not found. Deploy the function to the project configured by VITE_SUPABASE_URL.'
    }

    if (response.status === 401) {
      return 'Supabase rejected the Edge Function request. Sign in again, then retry.'
    }
  }

  const errorName = getErrorName(error)
  if (errorName === 'FunctionsFetchError') {
    return 'Could not reach the Supabase Edge Function. Check that it is deployed, VITE_SUPABASE_URL points to the right project, and the current app origin is allowed by the function CORS settings.'
  }

  if (errorName === 'FunctionsRelayError') {
    return 'Supabase could not route the Edge Function request. Check the function deployment and try again.'
  }

  return getSupabaseErrorMessage(error, fallback)
}
