import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const sitesDir = path.resolve('src/content/sites')

function parseArgs(argv) {
  const options = {
    inputPath: 'bookmarks_5_20_26.html',
    allowedFolders: new Set(),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]

    if (arg === '--folder' && argv[index + 1]) {
      options.allowedFolders.add(argv[index + 1])
      index += 1
      continue
    }

    if (arg.startsWith('--folder=')) {
      options.allowedFolders.add(arg.slice('--folder='.length))
      continue
    }

    if (!arg.startsWith('--') && options.inputPath === 'bookmarks_5_20_26.html') {
      options.inputPath = arg
    }
  }

  return {
    inputPath: path.resolve(options.inputPath),
    allowedFolders: options.allowedFolders,
  }
}

const { inputPath, allowedFolders } = parseArgs(process.argv.slice(2))

const placements = {
  developmentLearning: {
    parentCategory: 'development',
    subcategory: 'learning',
    category: 'Learning',
  },
  developmentReferences: {
    parentCategory: 'development',
    subcategory: 'references',
    category: 'References',
  },
  developmentTooling: {
    parentCategory: 'development',
    subcategory: 'tooling',
    category: 'Tooling',
  },
  developmentRepositories: {
    parentCategory: 'development',
    subcategory: 'repositories',
    category: 'Repositories',
  },
  developmentMcp: {
    parentCategory: 'development',
    subcategory: 'mcp',
    category: 'MCP',
  },
  developmentMonitoring: {
    parentCategory: 'development',
    subcategory: 'monitoring',
    category: 'Monitoring',
  },
  developmentCloudHosting: {
    parentCategory: 'development',
    subcategory: 'cloud-hosting',
    category: 'Hosting',
  },
  downloadsGames: {
    parentCategory: 'downloads',
    subcategory: 'game-download',
    category: 'Game Download',
  },
  downloadsVfx: {
    parentCategory: 'downloads',
    subcategory: 'vfx-download',
    category: 'VFX Download',
  },
  downloadsSoftware: {
    parentCategory: 'downloads',
    subcategory: 'software-download',
    category: 'Software Download',
  },
  downloadsTorrents: {
    parentCategory: 'downloads',
    subcategory: 'torrents',
    category: 'Torrents',
  },
  downloadsMovies: {
    parentCategory: 'downloads',
    subcategory: 'movies',
    category: 'Movies',
  },
  watchMovies: {
    parentCategory: 'watch',
    subcategory: 'movies',
    category: 'Movies',
  },
  watchAnime: {
    parentCategory: 'watch',
    subcategory: 'anime',
    category: 'Anime',
  },
}

const folderMap = new Map([
  ['Bookmarks bar > AI', { parentCategory: 'ai', subcategory: null, category: 'AI' }],
  [
    'Bookmarks bar > AI > Image',
    { parentCategory: 'ai', subcategory: 'image', category: 'AI Image' },
  ],
  ['Bookmarks bar > AI > API', { parentCategory: 'ai', subcategory: 'api', category: 'AI API' }],
  [
    'Bookmarks bar > AI > Detector',
    { parentCategory: 'ai', subcategory: 'detector', category: 'AI Detector' },
  ],
  [
    'Bookmarks bar > AI > Automation',
    { parentCategory: 'ai', subcategory: 'automation', category: 'AI Automation' },
  ],
  [
    'Bookmarks bar > AI > Video',
    { parentCategory: 'ai', subcategory: 'video', category: 'AI Video' },
  ],
  ['Bookmarks bar > AI > CHAT', { parentCategory: 'ai', subcategory: 'chat', category: 'AI Chat' }],
  [
    'Bookmarks bar > AI > WB',
    { parentCategory: 'ai', subcategory: 'wb', category: 'Website Builder' },
  ],
  [
    'Bookmarks bar > AI > WB > Mobile',
    { parentCategory: 'ai', subcategory: 'wb', category: 'Mobile Builder' },
  ],
  [
    'Bookmarks bar > AI > Research',
    { parentCategory: 'ai', subcategory: 'research', category: 'AI Research' },
  ],
  [
    'Bookmarks bar > ALL > ML',
    { parentCategory: 'ai', subcategory: 'ml', category: 'Machine Learning' },
  ],
  ['Bookmarks bar > ML', { parentCategory: 'ai', subcategory: 'ml', category: 'Machine Learning' }],
  ['Bookmarks bar > AI > PPT', { parentCategory: 'ai', subcategory: 'ppt', category: 'AI PPT' }],
  [
    'Bookmarks bar > AI > Others',
    { parentCategory: 'ai', subcategory: 'others', category: 'AI Tools' },
  ],
  [
    'Bookmarks bar > AI > CLI',
    { parentCategory: 'development', subcategory: 'cli-tools', category: 'AI CLI' },
  ],
  ['Bookmarks bar > CODE > Hosting Service', placements.developmentCloudHosting],
  [
    'Bookmarks bar > CODE > Database',
    { parentCategory: 'development', subcategory: 'cloud-hosting', category: 'Database' },
  ],
  ['Bookmarks bar > CODE > MCP', placements.developmentMcp],
  ['Bookmarks bar > CODE > uptimeMonitor', placements.developmentMonitoring],
  [
    'Bookmarks bar > Design',
    { parentCategory: 'design', subcategory: 'design-tools', category: 'Design Tools' },
  ],
  [
    'Bookmarks bar > Design > Insipiration',
    { parentCategory: 'design', subcategory: 'inspiration', category: 'Inspiration' },
  ],
  [
    'Bookmarks bar > Design > Inspiration',
    { parentCategory: 'design', subcategory: 'inspiration', category: 'Inspiration' },
  ],
  [
    'Bookmarks bar > Design > Fonts',
    { parentCategory: 'design', subcategory: 'fonts', category: 'Fonts' },
  ],
  ['Bookmarks bar > Design > 3d', { parentCategory: 'design', subcategory: '3d', category: '3D' }],
  ['Bookmarks bar > ALL > 3D', { parentCategory: 'design', subcategory: '3d', category: '3D' }],
  [
    'Bookmarks bar > Design > Promts',
    { parentCategory: 'design', subcategory: 'prompts', category: 'Prompts' },
  ],
  [
    'Bookmarks bar > Design > ICONS/SVG',
    { parentCategory: 'design', subcategory: 'icons-svg', category: 'Icons/SVG' },
  ],
  [
    'Bookmarks bar > Design > MD',
    { parentCategory: 'design', subcategory: 'md', category: 'Design MD' },
  ],
  [
    'Bookmarks bar > Design > Skills',
    { parentCategory: 'design', subcategory: 'design-tools', category: 'Design Skills' },
  ],
  [
    'Bookmarks bar > CMPNTS',
    { parentCategory: 'development', subcategory: 'ui-libraries', category: 'UI Library' },
  ],
  [
    'Bookmarks bar > CMPNTS > Icons',
    { parentCategory: 'design', subcategory: 'icons-svg', category: 'Icons/SVG' },
  ],
  [
    'Bookmarks bar > CMPNTS > SVG',
    { parentCategory: 'design', subcategory: 'icons-svg', category: 'Icons/SVG' },
  ],
  ['Bookmarks bar > DOWNLOADS > Game Download', placements.downloadsGames],
  ['Bookmarks bar > DOWNLOADS > VFX Download', placements.downloadsVfx],
  ['Bookmarks bar > DOWNLOADS > Software Download', placements.downloadsSoftware],
  ['Bookmarks bar > DOWNLOADS > Torrents', placements.downloadsTorrents],
  ['Bookmarks bar > DOWNLOADS > Movies', placements.downloadsMovies],
  ['Bookmarks bar > ALL > DOWNLOADS > Game Download', placements.downloadsGames],
  ['Bookmarks bar > ALL > DOWNLOADS > VFX Download', placements.downloadsVfx],
  ['Bookmarks bar > ALL > DOWNLOADS > Software Download', placements.downloadsSoftware],
  ['Bookmarks bar > ALL > DOWNLOADS > Torrents', placements.downloadsTorrents],
  ['Bookmarks bar > ALL > DOWNLOADS > Movies', placements.downloadsMovies],
  ['Bookmarks bar > WATCH > Movies', placements.watchMovies],
  ['Bookmarks bar > WATCH > Anime', placements.watchAnime],
  ['Bookmarks bar > Watch > Movies', placements.watchMovies],
  ['Bookmarks bar > Watch > Anime', placements.watchAnime],
  ['Bookmarks bar > ALL > WATCH > Movies', placements.watchMovies],
  ['Bookmarks bar > ALL > WATCH > Anime', placements.watchAnime],
])

function decodeHtml(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  }

  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&([a-z]+);/gi, (_, name) => named[name] || `&${name};`)
}

function cleanText(value) {
  return decodeHtml(value)
    .replace(/<[^>]*>/g, '')
    .replace(/â€“|â€”|–|—/g, '-')
    .replace(/â€™|’/g, "'")
    .replace(/â€œ|â€|“|”/g, '"')
    .replace(/Â·|·/g, '-')
    .replace(/Â/g, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7e]/g, ' ')
    .replace(/\(\s*\)/g, '')
    .replace(/^[\s|/\\:;,_-]+|[\s|/\\:;,_-]+$/g, '')
    .replace(/\s+([,.;!?])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

function domainSlug(url) {
  try {
    const ignoredSubdomains = new Set([
      'app',
      'chat',
      'cloud',
      'console',
      'dashboard',
      'docs',
      'editor',
    ])
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '')
    const labels = hostname.split('.')
    const base = labels.length > 2 && ignoredSubdomains.has(labels[0]) ? labels[1] : labels[0]
    return slugify(base)
  } catch {
    return ''
  }
}

function canonicalUrl(value) {
  try {
    const parsed = new URL(value)
    parsed.hash = ''

    if (parsed.pathname === '/') {
      parsed.pathname = ''
    } else {
      parsed.pathname = parsed.pathname.replace(/\/+$/g, '')
    }

    return parsed.toString().replace(/\/$/g, '')
  } catch {
    return value
  }
}

const slugOverrides = new Map([
  ['https://developers.google.com/ml-kit', 'ml-kit'],
  ['https://colab.research.google.com', 'colab'],
  ['https://www.ibm.com/think/topics/xgboost', 'xgboost'],
])

const sourceCodeOverrides = new Map([
  ['scikit-learn', 'https://github.com/scikit-learn/scikit-learn'],
  ['tensorflow', 'https://github.com/tensorflow/tensorflow'],
  ['pytorch', 'https://github.com/pytorch/pytorch'],
  ['kubeflow', 'https://github.com/kubeflow/kubeflow'],
  ['xgboost', 'https://github.com/dmlc/xgboost'],
])

function slugOverrideFor(row) {
  return slugOverrides.get(canonicalUrl(row.url)) || ''
}

function sourceCodeFor(row, slug) {
  return sourceCodeOverrides.get(slug) || githubRepoUrl(row.url) || ''
}

function withPublicUrl(row, url, name = row.name) {
  return {
    ...row,
    name,
    url,
  }
}

function normalizeBookmarkRow(row) {
  try {
    const parsed = new URL(row.url)
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '')
    const pathname = parsed.pathname.toLowerCase()

    if (hostname === 'editor.wix.com') return null
    if (hostname === 'archive.org' && pathname === '/details/nasa') return null

    if (hostname === 'dashboard.render.com') {
      return withPublicUrl(row, 'https://render.com/', 'Render')
    }

    if (hostname === 'fly.io' && pathname.startsWith('/dashboard')) {
      return withPublicUrl(row, 'https://fly.io/', 'Fly.io')
    }

    if (hostname === 'console.neon.tech') {
      return withPublicUrl(row, 'https://neon.tech/', 'Neon')
    }

    if (hostname === 'dashboard.uptimerobot.com') {
      return withPublicUrl(row, 'https://uptimerobot.com/', 'UptimeRobot')
    }

    if (hostname === 'uptime.betterstack.com') {
      return withPublicUrl(row, 'https://betterstack.com/uptime', 'Better Stack Uptime')
    }

    if (hostname === 'testsprite.com' && pathname.startsWith('/dashboard')) {
      return withPublicUrl(row, 'https://www.testsprite.com/', 'TestSprite')
    }

    if (hostname === 'replit.com' && pathname === '/~') {
      return withPublicUrl(row, 'https://replit.com/', 'Replit')
    }

    if (hostname === 'exercism.org' && pathname.startsWith('/dashboard')) {
      return withPublicUrl(row, 'https://exercism.org/', 'Exercism')
    }

    if (hostname === 'scrimba.com') {
      return withPublicUrl(row, `${parsed.origin}${parsed.pathname}`, row.name)
    }

    if (hostname === 'prisma.io') {
      return withPublicUrl(row, 'https://www.prisma.io/', 'Prisma')
    }
  } catch {
    return row
  }

  return row
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term))
}

function classifyCodeRoot(row) {
  const value = `${row.name} ${row.url}`.toLowerCase()

  if (includesAny(value, ['uptimerobot', 'betterstack.com/uptime'])) {
    return placements.developmentMonitoring
  }

  if (includesAny(value, ['vercel.com', 'fly.io', 'railway.com', 'cyclic.sh'])) {
    return placements.developmentCloudHosting
  }

  if (
    includesAny(value, [
      'codingame',
      'codecademy',
      'freecodecamp',
      'roadmap.sh',
      'learn-anything',
      'tutorialspoint',
      'codedex',
      'fullstackopen',
      'codeproject',
      'geeksforgeeks',
      'infinitecourses',
      'codecrafters',
      'brilliant',
      'w3schools',
      'exercism',
      'metana',
      'scrimba',
    ])
  ) {
    return placements.developmentLearning
  }

  if (
    includesAny(value, [
      'code.visualstudio.com/docs',
      '11ty.dev/docs',
      'jupyter.org',
      'medium.com/',
    ])
  ) {
    return placements.developmentReferences
  }

  if (value.includes('github.com/')) {
    return placements.developmentRepositories
  }

  if (includesAny(value, ['console.groq.com', 'groqcloud'])) {
    return { parentCategory: 'ai', subcategory: 'api', category: 'AI API' }
  }

  return placements.developmentTooling
}

function classifyCodeGithub(row) {
  const value = `${row.name} ${row.url}`.toLowerCase()

  if (value.includes('github.com/')) {
    return placements.developmentRepositories
  }

  if (value.includes('frontendmasters.com/courses')) {
    return placements.developmentLearning
  }

  return placements.developmentReferences
}

function configForBookmark(row) {
  if (row.folder === 'Bookmarks bar > CODE') {
    return classifyCodeRoot(row)
  }

  if (row.folder === 'Bookmarks bar > CODE > GitHub') {
    return classifyCodeGithub(row)
  }

  return folderMap.get(row.folder)
}

function siteDirectoryFor(config, slug) {
  const parts = [sitesDir, config.parentCategory]
  if (config.subcategory) parts.push(config.subcategory)
  parts.push(slug)
  return path.join(...parts)
}

function findExistingMetaFiles(dir) {
  if (!fs.existsSync(dir)) return []

  const results = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const metaPath = path.join(fullPath, 'meta.yaml')
      if (fs.existsSync(metaPath)) {
        results.push(metaPath)
      } else {
        results.push(...findExistingMetaFiles(fullPath))
      }
    }
  }
  return results
}

function readExistingSites() {
  const slugs = new Set()
  const urls = new Set()

  for (const metaPath of findExistingMetaFiles(sitesDir)) {
    const content = fs.readFileSync(metaPath, 'utf8')
    const meta = yaml.load(content) || {}
    if (meta.slug) slugs.add(meta.slug)
    if (meta.website) urls.add(canonicalUrl(meta.website))
  }

  return { slugs, urls }
}

function parseBookmarks(html) {
  const stack = []
  const rows = []

  for (const line of html.split(/\r?\n/)) {
    const folderMatch = line.match(/<DT><H3[^>]*>(.*?)<\/H3>/i)
    if (folderMatch) {
      stack.push(cleanText(folderMatch[1]))
      continue
    }

    if (/<\/DL><p>/i.test(line)) {
      stack.pop()
      continue
    }

    const linkMatch = line.match(/<DT><A\s+HREF="([^"]+)"[^>]*>(.*?)<\/A>/i)
    if (linkMatch) {
      rows.push({
        folder: stack.join(' > '),
        name: cleanText(linkMatch[2]),
        url: decodeHtml(linkMatch[1]),
      })
    }
  }

  return rows
}

function uniqueSlug(baseSlug, name, usedSlugs) {
  const nameSlug = slugify(name)
  const fallback = nameSlug || 'bookmark'
  let slug = baseSlug || fallback

  if (usedSlugs.has(slug) && nameSlug && !slug.endsWith(nameSlug)) {
    slug = `${slug}-${nameSlug}`.slice(0, 80).replace(/-+$/g, '')
  }

  let index = 2
  const original = slug
  while (usedSlugs.has(slug)) {
    slug = `${original}-${index}`
    index += 1
  }

  usedSlugs.add(slug)
  return slug
}

function displayNameFor(row, slug) {
  const name = row.name || ''
  if (!name || /^[\d\s._-]+$/.test(name)) return slug
  return name
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '')) ? 'an' : 'a'
}

function detailSectionsFor(row, config, displayName) {
  const lowerCategory = config.category.toLowerCase()
  const article = articleFor(lowerCategory)

  if (config.parentCategory === 'downloads') {
    return {
      coreFeatures: [
        {
          name: 'Download Source',
          description: `${displayName} is saved as ${article} ${lowerCategory} bookmark.`,
          icon: 'check',
        },
        {
          name: 'Direct Web Launch',
          description: 'Open the saved source directly from the catalog entry.',
          icon: 'check',
        },
      ],
      additionalFeatures: [
        {
          name: 'Imported Bookmark',
          description: 'Preserves the saved browser bookmark link.',
          icon: 'check',
        },
        {
          name: 'Grouped by Type',
          description: 'Sorted into the downloads collection for focused browsing.',
          icon: 'check',
        },
      ],
    }
  }

  if (config.parentCategory === 'design') {
    return {
      coreFeatures: [
        {
          name: 'Design Resource',
          description: `${displayName} is cataloged as ${article} ${lowerCategory} resource for design work.`,
          icon: 'check',
        },
        {
          name: 'Visual Reference',
          description: 'Useful as inspiration, tooling, assets, or implementation reference.',
          icon: 'check',
        },
      ],
      additionalFeatures: [
        {
          name: 'Browser Workflow',
          description: 'Works from the saved site link with no local install required.',
          icon: 'check',
        },
        {
          name: 'Sorted by Discipline',
          description: 'Grouped under the matching design subcategory.',
          icon: 'check',
        },
        {
          name: 'Reusable Reference',
          description: 'Kept with tags and metadata for repeat use.',
          icon: 'check',
        },
      ],
    }
  }

  if (config.parentCategory === 'development' && config.subcategory === 'cloud-hosting') {
    return {
      coreFeatures: [
        {
          name: 'Cloud Service',
          description: `${displayName} is tracked as ${article} ${lowerCategory} resource for hosting, deployment, or backend infrastructure.`,
          icon: 'check',
        },
        {
          name: 'Hosted Access',
          description: 'Open the saved service directly from the catalog entry.',
          icon: 'check',
        },
      ],
      additionalFeatures: [
        {
          name: 'Documentation Path',
          description: 'Docs are linked when available for setup details.',
          icon: 'check',
        },
        {
          name: 'Deployment Context',
          description: 'Deployment type is recorded in the metadata.',
          icon: 'check',
        },
        {
          name: 'Developer Workflow',
          description: 'Grouped under Development with related cloud and hosting resources.',
          icon: 'check',
        },
      ],
    }
  }

  return {
    coreFeatures: [
      {
        name: 'Web Resource',
        description: `${displayName} is tracked as ${article} ${lowerCategory} resource.`,
        icon: 'check',
      },
      {
        name: 'Direct Access',
        description: 'Open the saved site directly from the catalog entry.',
        icon: 'check',
      },
    ],
    additionalFeatures: [
      {
        name: 'Imported Bookmark',
        description: 'Preserves the saved browser bookmark link.',
        icon: 'check',
      },
      {
        name: 'Catalog Metadata',
        description: 'Includes category, tags, and primary links for browsing.',
        icon: 'check',
      },
    ],
  }
}

function metadataFor(row, config, slug) {
  const sourceCode = sourceCodeFor(row, slug)
  const displayName = displayNameFor(row, slug)
  const detailSections = detailSectionsFor(row, config, displayName)
  const tagParts = [
    'bookmark',
    config.parentCategory,
    config.subcategory,
    ...config.category.toLowerCase().split(/[^a-z0-9]+/),
  ].filter(Boolean)

  return {
    slug,
    name: displayName,
    description: `${displayName} bookmarked for ${config.category.toLowerCase()} resources.`,
    category: config.category,
    parentCategory: config.parentCategory,
    subcategory: config.subcategory,
    stars: 0,
    watchers: 0,
    addedDaysAgo: 0,
    license: 'Bookmark',
    lastCommit: 'Imported May 20, 2026',
    lastRelease: 'Bookmark',
    version: '',
    contributors: 0,
    commitsThisYear: 0,
    releases: 0,
    platforms: ['Web'],
    deployment: ['Cloud'],
    website: row.url,
    docs: row.url,
    sourceCode: sourceCode || '',
    icon: domainSlug(row.url) || slug,
    verified: false,
    featured: false,
    tags: Array.from(new Set(tagParts)),
    atGlance: displayName,
    fullDescription: fullDescriptionFor(displayName, config),
    coreFeatures: detailSections.coreFeatures,
    additionalFeatures: detailSections.additionalFeatures,
    similarTools: [],
  }
}

function fullDescriptionFor(displayName, config) {
  const lowerCategory = config.category.toLowerCase()
  const article = articleFor(lowerCategory)

  if (config.parentCategory === 'design') {
    return `${displayName} is kept as ${article} ${lowerCategory} resource for design inspiration, assets, and reference work.`
  }

  if (config.parentCategory === 'ai') {
    return `${displayName} is kept as ${article} ${lowerCategory} resource for AI-assisted workflows.`
  }

  if (config.parentCategory === 'development') {
    if (config.subcategory === 'cloud-hosting') {
      return `${displayName} is kept as ${article} ${lowerCategory} resource for cloud hosting, deployment, or backend infrastructure work.`
    }

    if (config.subcategory === 'cli-tools') {
      return `${displayName} is kept as a command-line and developer workflow resource.`
    }

    if (config.subcategory === 'ui-libraries') {
      return `${displayName} is kept as a UI component and design system reference.`
    }

    return `${displayName} is kept as ${article} ${lowerCategory} resource for building and shipping software.`
  }

  if (config.parentCategory === 'downloads') {
    return `${displayName} is kept as ${article} ${lowerCategory} source in the downloads collection.`
  }

  if (config.parentCategory === 'cli-tools') {
    return `${displayName} is kept as a command-line and developer workflow resource.`
  }

  if (config.parentCategory === 'ui-libraries') {
    return `${displayName} is kept as a UI component and design system reference.`
  }

  return `${displayName} is kept as a curated web resource for repeat use.`
}

function githubRepoUrl(url) {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.toLowerCase() !== 'github.com') return ''

    const parts = parsed.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return ''

    return `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/i, '')}`
  } catch {
    return ''
  }
}

if (!fs.existsSync(inputPath)) {
  throw new Error(`Bookmark export not found: ${inputPath}`)
}

const { slugs, urls } = readExistingSites()
const bookmarks = parseBookmarks(fs.readFileSync(inputPath, 'utf8'))
let imported = 0
let skipped = 0

for (const originalRow of bookmarks) {
  if (allowedFolders.size && !allowedFolders.has(originalRow.folder)) {
    skipped += 1
    continue
  }

  const row = normalizeBookmarkRow(originalRow)
  if (!row) {
    skipped += 1
    continue
  }

  const config = configForBookmark(row)
  const canonical = canonicalUrl(row.url)
  if (!config || urls.has(canonical)) {
    skipped += 1
    continue
  }

  const slug = uniqueSlug(slugOverrideFor(row) || domainSlug(row.url), row.name, slugs)
  const outputDir = siteDirectoryFor(config, slug)
  const outputPath = path.join(outputDir, 'meta.yaml')

  if (fs.existsSync(outputPath)) {
    skipped += 1
    continue
  }

  fs.mkdirSync(outputDir, { recursive: true })
  fs.writeFileSync(
    outputPath,
    `${yaml.dump(metadataFor(row, config, slug), {
      lineWidth: 100,
      noRefs: true,
      quotingType: '"',
    })}`,
  )
  urls.add(canonical)
  imported += 1
}

console.log(`Imported ${imported} bookmarks into src/content/sites`)
console.log(`Skipped ${skipped} bookmarks outside mapped folders or already imported`)
