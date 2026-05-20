import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import sharp from 'sharp'
import puppeteer from 'puppeteer-core'

const sitesIndexPath = path.resolve('src/content/sites-index.json')
const publicPreviewsDir = path.resolve('public/previews')
const publicManifestPath = path.join(publicPreviewsDir, 'manifest.json')
const publicReportPath = path.join(publicPreviewsDir, 'report.json')
const srcManifestPath = path.resolve('src/content/site-previews.json')

const defaults = {
  concurrency: 3,
  timeout: 15000,
  width: 1440,
  height: 900,
  outputWidth: 960,
  outputHeight: 600,
  smallWidth: 480,
  smallHeight: 300,
  quality: 80,
}

function parseArgs(argv) {
  const options = {
    all: false,
    dryRun: false,
    limit: 0,
    slugs: new Set(),
    concurrency: defaults.concurrency,
    timeout: defaults.timeout,
  }

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const [key, inlineValue] = arg.split('=')
    const nextValue = inlineValue ?? argv[index + 1]

    if (arg === '--all' || arg === '--force') options.all = true
    if (arg === '--dry-run') options.dryRun = true
    if (key === '--limit' && nextValue) {
      options.limit = Number(nextValue)
      if (!inlineValue) index += 1
    }
    if (key === '--concurrency' && nextValue) {
      options.concurrency = Number(nextValue)
      if (!inlineValue) index += 1
    }
    if (key === '--timeout' && nextValue) {
      options.timeout = Number(nextValue)
      if (!inlineValue) index += 1
    }
    if (key === '--slug' && nextValue) {
      for (const slug of nextValue.split(',').map(value => value.trim()).filter(Boolean)) {
        options.slugs.add(slug)
      }
      if (!inlineValue) index += 1
    }
  }

  return {
    ...options,
    concurrency: Number.isFinite(options.concurrency) && options.concurrency > 0
      ? Math.min(options.concurrency, 6)
      : defaults.concurrency,
    timeout: Number.isFinite(options.timeout) && options.timeout > 0
      ? options.timeout
      : defaults.timeout,
    limit: Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 0,
  }
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(`${filePath}.tmp`, `${JSON.stringify(value, null, 2)}\n`)
  fs.renameSync(`${filePath}.tmp`, filePath)
}

function normalizeUrl(value) {
  try {
    const url = new URL(value)
    if (!['http:', 'https:'].includes(url.protocol)) return null
    url.hash = ''
    return url.toString()
  } catch {
    return null
  }
}

function shouldSkipUrl(value) {
  const url = normalizeUrl(value)
  if (!url) return true

  const parsed = new URL(url)
  const hostname = parsed.hostname.toLowerCase()
  const pathname = parsed.pathname.toLowerCase()

  if (['localhost', '127.0.0.1', '::1'].includes(hostname)) return true
  if (hostname === 'dashboard.render.com') return true
  if (hostname === 'console.neon.tech') return true
  if (hostname === 'editor.wix.com') return true
  if (hostname === 'uptime.betterstack.com' && pathname.startsWith('/team/')) return true
  if (hostname === 'dashboard.uptimerobot.com') return true
  if (hostname === 'fly.io' && pathname.startsWith('/dashboard')) return true

  return false
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).size > 0
  } catch {
    return false
  }
}

function findBrowserExecutable() {
  const envPath = process.env.PREVIEW_BROWSER_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  if (envPath && fs.existsSync(envPath)) return envPath

  const home = os.homedir()
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    path.join(home, 'AppData/Local/Google/Chrome/Application/chrome.exe'),
    path.join(home, 'AppData/Local/Microsoft/Edge/Application/msedge.exe'),
  ]

  return candidates.find(candidate => fs.existsSync(candidate)) || ''
}

function sortManifest(manifest) {
  return Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)))
}

async function preparePage(page) {
  await page.setViewport({
    width: defaults.width,
    height: defaults.height,
    deviceScaleFactor: 1,
  })
  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'
  )
  await page.setExtraHTTPHeaders({
    'accept-language': 'en-US,en;q=0.9',
  })
  await page.setRequestInterception(true)
  page.on('request', request => {
    if (request.resourceType() === 'media') {
      void request.abort()
      return
    }
    void request.continue()
  })
}

async function settlePage(page, timeout) {
  try {
    await page.waitForNetworkIdle({ idleTime: 800, timeout: Math.min(timeout, 6000) })
  } catch {
    // Some sites keep long-polling connections open. The viewport capture can still be useful.
  }

  await page.evaluate(async () => {
    document.documentElement.style.scrollBehavior = 'auto'
    window.scrollTo(0, Math.min(500, document.body.scrollHeight / 3))
    await new Promise(resolve => window.setTimeout(resolve, 450))
    window.scrollTo(0, 0)
    await document.fonts?.ready
  })
  await new Promise(resolve => setTimeout(resolve, 500))
}

async function captureSite(browser, site, options) {
  const page = await browser.newPage()
  const normalizedUrl = normalizeUrl(site.website)

  if (!normalizedUrl) {
    await page.close()
    throw new Error('Invalid URL')
  }

  try {
    await preparePage(page)
    await page.goto(normalizedUrl, {
      waitUntil: 'domcontentloaded',
      timeout: options.timeout,
    })
    await settlePage(page, options.timeout)

    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
      captureBeyondViewport: false,
    })

    const image = await sharp(screenshot)
      .resize(defaults.outputWidth, defaults.outputHeight, {
        fit: 'cover',
        position: 'top',
      })
      .webp({ quality: defaults.quality, effort: 4 })
      .toBuffer()

    const small = await sharp(screenshot)
      .resize(defaults.smallWidth, defaults.smallHeight, {
        fit: 'cover',
        position: 'top',
      })
      .webp({ quality: defaults.quality, effort: 4 })
      .toBuffer()

    const imagePath = path.join(publicPreviewsDir, `${site.slug}.webp`)
    const smallPath = path.join(publicPreviewsDir, `${site.slug}-sm.webp`)

    if (!options.dryRun) {
      fs.mkdirSync(publicPreviewsDir, { recursive: true })
      fs.writeFileSync(imagePath, image)
      fs.writeFileSync(smallPath, small)
    }

    return {
      image: `/previews/${site.slug}.webp`,
      small: `/previews/${site.slug}-sm.webp`,
      sourceUrl: normalizedUrl,
      capturedAt: new Date().toISOString(),
      width: defaults.outputWidth,
      height: defaults.outputHeight,
      bytes: image.byteLength,
    }
  } finally {
    await page.close()
  }
}

function eligibleSites(sites, manifest, options) {
  const filtered = sites.filter(site => {
    if (!site.slug || !site.website) return false
    if (shouldSkipUrl(site.website)) return false
    if (options.slugs.size && !options.slugs.has(site.slug)) return false
    if (options.all) return true

    const imagePath = path.join(publicPreviewsDir, `${site.slug}.webp`)
    const smallPath = path.join(publicPreviewsDir, `${site.slug}-sm.webp`)
    return !manifest[site.slug] || !fileExists(imagePath) || !fileExists(smallPath)
  })

  return options.limit ? filtered.slice(0, options.limit) : filtered
}

async function runWorker(workerId, browser, queue, manifest, failures, options) {
  while (queue.length) {
    const site = queue.shift()
    if (!site) return

    const prefix = `[${workerId}] ${site.slug}`
    try {
      console.log(`${prefix} capturing ${site.website}`)
      manifest[site.slug] = await captureSite(browser, site, options)
      console.log(`${prefix} saved ${manifest[site.slug].bytes} bytes`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push({ slug: site.slug, website: site.website, error: message })
      console.warn(`${prefix} failed: ${message}`)
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  const browserPath = findBrowserExecutable()

  if (!browserPath) {
    throw new Error(
      'No Chrome or Edge executable found. Install Chrome/Edge or set PREVIEW_BROWSER_PATH.'
    )
  }

  const sites = readJson(sitesIndexPath, [])
  const manifest = readJson(srcManifestPath, {})
  const queue = eligibleSites(sites, manifest, options)
  const failures = []

  console.log(
    JSON.stringify(
      {
        mode: options.dryRun ? 'dry-run' : 'apply',
        browserPath,
        candidates: queue.length,
        concurrency: options.concurrency,
        timeout: options.timeout,
      },
      null,
      2
    )
  )

  if (!queue.length) {
    writeJson(publicManifestPath, sortManifest(manifest))
    writeJson(srcManifestPath, sortManifest(manifest))
    writeJson(publicReportPath, { captured: 0, failed: 0, failures })
    return
  }

  const browser = await puppeteer.launch({
    executablePath: browserPath,
    headless: true,
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-notifications',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-sandbox',
    ],
  })

  try {
    await Promise.all(
      Array.from({ length: options.concurrency }, (_, index) =>
        runWorker(index + 1, browser, queue, manifest, failures, options)
      )
    )
  } finally {
    await browser.close()
  }

  const sortedManifest = sortManifest(manifest)
  if (!options.dryRun) {
    writeJson(publicManifestPath, sortedManifest)
    writeJson(srcManifestPath, sortedManifest)
  }
  writeJson(publicReportPath, {
    captured: Object.keys(sortedManifest).length,
    failed: failures.length,
    failures,
  })

  console.log(
    JSON.stringify(
      {
        captured: Object.keys(sortedManifest).length,
        failed: failures.length,
      },
      null,
      2
    )
  )
}

await main()
