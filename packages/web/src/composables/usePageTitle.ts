/**
 * Derives a human-readable page title from the current route path.
 *
 * Title format:
 *   - Home             → "Holy Grail"
 *   - /sites           → "Sites | Holy Grail"
 *   - /sites/ai        → "AI | Holy Grail"
 *   - /sites/ai/detector → "AI • Detector | Holy Grail"
 *   - /skills/skills   → "Skills | Holy Grail"
 *   - /skills/design   → "Skills • Design | Holy Grail"
 *   - /extensions/writing → "Extensions • Writing | Holy Grail"
 *   - /publish         → "Publish | Holy Grail"
 *   - /login           → "Sign In | Holy Grail"
 *   - /signup          → "Sign Up | Holy Grail"
 *   - /account         → "Account | Holy Grail"
 *   - /bookmarks       → "Bookmarks | Holy Grail"
 *   - /changelog       → "Changelog | Holy Grail"
 *   - /docs            → "Documentation | Holy Grail"
 */

import { labelFor } from '@/components/sidebar/sidebarNav'

const SITE_APP_NAME = 'Holy Grail'

/**
 * Given a route path, returns the full document title string.
 */
function titleFromPath(path: string): string {
  const clean = path.replace(/\/$/, '') || '/'

  if (clean === '/' || clean === '') {
    return SITE_APP_NAME
  }

  const parts = clean.split('/').filter(Boolean) // e.g. ['sites', 'ai', 'detector']

  const [section, ...rest] = parts

  // ── /sites ─────────────────────────────────────────────────────────────
  if (section === 'sites') {
    if (rest.length === 0) return `Sites | ${SITE_APP_NAME}`

    const [category, subcategory] = rest
    const categoryLabel = labelFor(category)

    if (!subcategory) return `${categoryLabel} | ${SITE_APP_NAME}`

    const subcategoryLabel = labelFor(subcategory)
    return `${categoryLabel} • ${subcategoryLabel} | ${SITE_APP_NAME}`
  }

  // ── /skills ─────────────────────────────────────────────────────────────
  if (section === 'skills') {
    if (rest.length === 0) return `Skills | ${SITE_APP_NAME}`

    const [category] = rest
    // /skills/skills → "Skills | Holy Grail" (top-level listing)
    if (category === 'skills') return `Skills | ${SITE_APP_NAME}`

    return `Skills • ${labelFor(category)} | ${SITE_APP_NAME}`
  }

  // ── /extensions ─────────────────────────────────────────────────────────
  if (section === 'extensions') {
    if (rest.length === 0) return `Extensions | ${SITE_APP_NAME}`

    const [category, subcategory] = rest
    const categoryLabel = labelFor(category)

    if (!subcategory) return `Extensions • ${categoryLabel} | ${SITE_APP_NAME}`

    const subcategoryLabel = labelFor(subcategory)
    return `Extensions • ${categoryLabel} • ${subcategoryLabel} | ${SITE_APP_NAME}`
  }

  // ── simple named routes ──────────────────────────────────────────────────
  const label = labelFor(section)
  return `${label} | ${SITE_APP_NAME}`
}

/**
 * Install an `afterEach` navigation guard on the given router that updates
 * `document.title` on every navigation.
 *
 * Call this once in `main.ts` before mounting the app.
 */
export function installPageTitleGuard(router: {
  afterEach: (guard: (to: { path: string }) => void) => void
}): void {
  router.afterEach((to) => {
    document.title = titleFromPath(to.path)
  })
}
