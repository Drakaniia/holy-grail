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

const SITE_APP_NAME = 'Holy Grail'

/** Human-readable labels for url path segments. */
const SEGMENT_LABELS: Record<string, string> = {
  // top-level
  sites: 'Sites',
  skills: 'Skills',
  extensions: 'Extensions',
  publish: 'Publish',
  submit: 'Publish',
  login: 'Sign In',
  signup: 'Sign Up',
  account: 'Account',
  bookmarks: 'Bookmarks',
  changelog: 'Changelog',
  docs: 'Documentation',
  admin: 'Admin',

  // sites categories
  ai: 'AI',
  design: 'Design',
  development: 'Development',
  watch: 'Watch',
  downloads: 'Downloads',

  // sites subcategories
  image: 'Image',
  api: 'API',
  detector: 'Detector',
  automation: 'Automation',
  'agent-skills': 'Agent Skills',
  video: 'Video',
  ml: 'Machine Learning',
  chat: 'CHAT',
  wb: 'Website Development',
  research: 'Research',
  ppt: 'PPT',
  others: 'Others',
  inspiration: 'Inspiration',
  fonts: 'Fonts',
  '3d': '3D',
  prompts: 'Prompts',
  'icons-svg': 'ICONS/SVG',
  md: 'MD',
  'design-tools': 'Design Tools',
  'cloud-hosting': 'Cloud & Hosting',
  learning: 'Learning',
  references: 'References',
  tooling: 'Tooling',
  'cli-tools': 'CLI Tools',
  'ui-libraries': 'UI Libraries',
  repositories: 'Repositories',
  mcp: 'MCP',
  monitoring: 'Monitoring',
  movies: 'Movies',
  anime: 'Anime',
  'game-download': 'Game Download',
  'vfx-download': 'VFX Download',
  'software-download': 'Software Download',
  torrents: 'Torrents',

  // skills subcategories
  // "skills" is the parent category AND the path segment for the skills list
  // We handle this in the title builder below.

  // extensions categories
  writing: 'Writing',
  productivity: 'Productivity',
  'developer-tools': 'Developer Tools',
  privacy: 'Privacy',
}

function labelFor(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment
}

/**
 * Given a route path, returns the full document title string.
 */
export function titleFromPath(path: string): string {
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
