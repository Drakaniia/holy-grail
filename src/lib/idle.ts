interface IdleTaskOptions {
  delay?: number
  timeout?: number
}

export function scheduleIdleTask(callback: () => void, options: IdleTaskOptions = {}) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const delay = Math.max(0, options.delay ?? 0)
  const timeout = Math.max(0, options.timeout ?? 3000)
  let idleId: number | undefined
  let timerId: number | undefined
  let cancelled = false

  const run = () => {
    if (cancelled) return
    idleId = undefined
    timerId = undefined
    callback()
  }

  const schedule = () => {
    if (cancelled) return

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(run, { timeout })
      return
    }

    timerId = window.setTimeout(run, timeout)
  }

  if (delay > 0) {
    timerId = window.setTimeout(schedule, delay)
  } else {
    schedule()
  }

  return () => {
    cancelled = true

    if (timerId !== undefined) {
      window.clearTimeout(timerId)
    }

    if (idleId !== undefined && 'cancelIdleCallback' in window) {
      window.cancelIdleCallback(idleId)
    }
  }
}
