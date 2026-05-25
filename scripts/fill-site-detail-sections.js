import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const sitesDir = path.resolve('src/content/sites')
const applyChanges = process.argv.includes('--apply')
const onlyNew = !process.argv.includes('--all')
const refreshSimilar = process.argv.includes('--refresh-similar')
const refreshDescriptions = process.argv.includes('--refresh-descriptions')
const refreshFeatures = process.argv.includes('--refresh-features')

function readOption(name) {
  const inline = process.argv.find(arg => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)

  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : ''
}

const parentFilter = readOption('--parent')
const subcategoryFilter = readOption('--subcategory')

function walkMetaFiles(dir) {
  const files = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkMetaFiles(fullPath))
    } else if (entry.name === 'meta.yaml') {
      files.push(fullPath)
    }
  }
  return files
}

function compactName(name) {
  return String(name || 'This site')
    .replace(/\s*\|\s*/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()
}

function articleFor(value) {
  return /^[aeiou]/i.test(String(value || '')) ? 'an' : 'a'
}

function context(meta) {
  const name = compactName(meta.name)
  const category = meta.category || 'Web Resource'
  const lowerCategory = category.toLowerCase()
  const article = articleFor(lowerCategory)
  const parent = meta.parentCategory || ''
  const subcategory = meta.subcategory || ''

  if (parent === 'ai' && subcategory === 'chat') {
    return {
      core: [
        ['Conversational Workspace', `${name} provides a browser-based chat interface for AI-assisted work.`],
        ['Fast Web Access', 'Open the live service directly from the catalog without local setup.'],
      ],
      extra: [
        ['Cloud Hosted', 'Runs as an online service from the provider.'],
        ['Reference Link', 'Website and documentation links are kept with the entry.'],
        ['Category Grouping', 'Grouped with other AI chat tools for quick comparison.'],
      ],
    }
  }

  if (parent === 'ai' && subcategory === 'ml') {
    return {
      core: [
        [
          'Machine Learning Resource',
          `${name} is tracked for model development, data science, or machine learning reference work.`,
        ],
        ['Direct Web Launch', 'Open the saved ML resource directly from the catalog entry.'],
      ],
      extra: [
        ['Data Science Workflow', 'Useful for notebooks, model training, evaluation, deployment, or ML research.'],
        ['Documentation Shortcut', 'Keeps the primary reference URL beside the saved tool or framework.'],
        ['Category Grouping', 'Grouped with related ML frameworks, platforms, and learning resources.'],
      ],
    }
  }

  if (parent === 'ai') {
    return {
      core: [
        [
          'AI Workflow Support',
          `${name} is tracked as ${article} ${lowerCategory} resource for AI-assisted workflows.`,
        ],
        ['Direct Web Launch', 'The live product is available from the saved website link.'],
      ],
      extra: [
        ['Cloud Access', 'Designed to be used through a hosted web experience.'],
        ['Documentation Shortcut', 'Keeps the primary reference URL beside the tool.'],
        ['Catalog Tags', 'Tagged by AI category and subcategory for browsing.'],
      ],
    }
  }

  if (parent === 'design') {
    return {
      core: [
        ['Design Resource', `${name} is cataloged as ${article} ${lowerCategory} resource for design work.`],
        ['Visual Reference', 'Useful as inspiration, tooling, assets, or implementation reference.'],
      ],
      extra: [
        ['Browser Workflow', 'Works from the saved site link with no local install required.'],
        ['Sorted by Discipline', 'Grouped under the matching design subcategory.'],
        ['Reusable Reference', 'Kept with tags and metadata for repeat use.'],
      ],
    }
  }

  if (parent === 'ui-libraries') {
    return {
      core: [
        ['Component Resource', `${name} is tracked as a UI component or library resource.`],
        ['Implementation Reference', 'Use the website or source link to inspect usage patterns.'],
      ],
      extra: [
        ['Design System Fit', 'Useful for comparing component styles and interaction patterns.'],
        ['Developer Friendly', 'Source code is linked when a public repository is available.'],
        ['Catalog Tags', 'Grouped with similar UI libraries for discovery.'],
      ],
    }
  }

  if (parent === 'development' && subcategory === 'cloud-hosting') {
    return {
      core: [
        ['Cloud Service', `${name} is tracked for cloud hosting, deployment, or backend infrastructure work.`],
        ['Hosted Access', 'The primary service is available through the website link.'],
      ],
      extra: [
        ['Documentation Path', 'Docs are linked when available for setup details.'],
        ['Deployment Context', 'Deployment type is recorded in the metadata.'],
        ['Developer Workflow', 'Grouped under Development with related cloud and hosting resources.'],
      ],
    }
  }

  if (parent === 'development') {
    return {
      core: [
        [
          'Developer Resource',
          `${name} is tracked as ${article} ${lowerCategory} resource for building and shipping software.`,
        ],
        ['Workflow Reference', 'The saved link keeps the resource close to related development material.'],
      ],
      extra: [
        ['Sorted by Use Case', 'Grouped by learning, references, tooling, repositories, MCP, or monitoring.'],
        ['Browser Ready', 'Available from the catalog without local setup.'],
        ['Repeatable Lookup', 'Metadata and tags make the resource easy to find later.'],
      ],
    }
  }

  if (parent === 'downloads') {
    return {
      core: [
        ['Download Source', `${name} is cataloged as ${article} ${lowerCategory} bookmark.`],
        ['Direct Web Launch', 'Open the saved source directly from the catalog entry.'],
      ],
      extra: [
        ['Grouped by Type', 'Sorted by games, VFX, software, torrents, or movies.'],
        ['Imported Bookmark', 'Preserves the saved browser bookmark link.'],
        ['Catalog Tags', 'Tagged under the downloads collection for search and filtering.'],
      ],
    }
  }

  if (parent === 'cli-tools') {
    return {
      core: [
        ['Developer Tooling', `${name} is tracked as a command-line or developer workflow resource.`],
        ['Reference Access', 'Website and docs links are preserved for setup and usage details.'],
      ],
      extra: [
        ['Source Visibility', 'Public repository stats are shown when a repo is available.'],
        ['Workflow Utility', 'Useful for development, automation, or evaluation tasks.'],
        ['Catalog Grouping', 'Grouped with other CLI and developer tools.'],
      ],
    }
  }

  return {
    core: [
      ['Web Resource', `${name} is tracked as ${article} ${lowerCategory} resource.`],
      ['Direct Access', 'Open the live site directly from the catalog.'],
    ],
    extra: [
      ['Metadata Ready', 'Includes category, tags, and primary links.'],
      ['Browse Friendly', 'Grouped with related entries for discovery.'],
      ['Cloud First', 'Usable through the saved website link.'],
    ],
  }
}

function featureObjects(rows) {
  return rows.map(([name, description]) => ({
    name,
    description,
    icon: 'check',
  }))
}

function similarToolsFor(site, allSites) {
  const byStatsAndName = (a, b) => {
    const aStars = a.meta.stars || 0
    const bStars = b.meta.stars || 0
    return bStars - aStars || compactName(a.meta.name).localeCompare(compactName(b.meta.name))
  }

  const toSimilarTool = candidate => ({
    slug: candidate.meta.slug || path.basename(path.dirname(candidate.filePath)),
    name: candidate.meta.name || '',
    description: candidate.meta.description || '',
    stars: candidate.meta.stars || 0,
    addedDaysAgo: candidate.meta.addedDaysAgo || 0,
    verified: Boolean(candidate.meta.verified),
    website: candidate.meta.website || '',
  })

  const exactGroup = allSites.filter(
    candidate =>
      candidate.meta.slug !== site.meta.slug &&
      candidate.meta.parentCategory === site.meta.parentCategory &&
      (candidate.meta.subcategory || null) === (site.meta.subcategory || null)
  )

  const categoryGroup = allSites.filter(
    candidate =>
      candidate.meta.slug !== site.meta.slug &&
      candidate.meta.parentCategory === site.meta.parentCategory &&
      candidate.meta.category === site.meta.category &&
      !exactGroup.some(exact => exact.meta.slug === candidate.meta.slug)
  )

  const parentGroup = allSites.filter(
    candidate =>
      candidate.meta.slug !== site.meta.slug &&
      candidate.meta.parentCategory === site.meta.parentCategory &&
      !exactGroup.some(exact => exact.meta.slug === candidate.meta.slug) &&
      !categoryGroup.some(category => category.meta.slug === candidate.meta.slug)
  )

  const globalGroup = allSites.filter(
    candidate =>
      candidate.meta.slug !== site.meta.slug &&
      !exactGroup.some(exact => exact.meta.slug === candidate.meta.slug) &&
      !categoryGroup.some(category => category.meta.slug === candidate.meta.slug) &&
      !parentGroup.some(parent => parent.meta.slug === candidate.meta.slug)
  )

  const ordered = [exactGroup, categoryGroup, parentGroup, globalGroup].flatMap(group =>
    group.sort(byStatsAndName)
  )

  return ordered.slice(0, 3).map(toSimilarTool)
}

function isImportDescription(value) {
  return /imported from the browser bookmark folder|browser bookmark folder|Bookmarks bar/i.test(
    String(value || '')
  )
}

function hasImportFeature(features) {
  return (features || []).some(feature => isImportDescription(feature?.description))
}

function fullDescriptionFor(meta) {
  const name = compactName(meta.name)
  const category = String(meta.category || 'web resource').toLowerCase()
  const article = articleFor(category)

  if (meta.parentCategory === 'design') {
    return `${name} is kept as ${article} ${category} resource for design inspiration, assets, and reference work.`
  }

  if (meta.parentCategory === 'ai') {
    return `${name} is kept as ${article} ${category} resource for AI-assisted workflows.`
  }

  if (meta.parentCategory === 'development') {
    if (meta.subcategory === 'cloud-hosting') {
      return `${name} is kept as ${article} ${category} resource for cloud hosting, deployment, or backend infrastructure work.`
    }

    return `${name} is kept as ${article} ${category} resource for building and shipping software.`
  }

  if (meta.parentCategory === 'downloads') {
    return `${name} is kept as ${article} ${category} source in the downloads collection.`
  }

  if (meta.parentCategory === 'cli-tools') {
    return `${name} is kept as a command-line and developer workflow resource.`
  }

  if (meta.parentCategory === 'ui-libraries') {
    return `${name} is kept as a UI component and design system reference.`
  }

  return `${name} is kept as a curated web resource for repeat use.`
}

function orderedMeta(meta, details) {
  const shouldRefreshDescription =
    refreshDescriptions || !meta.fullDescription || isImportDescription(meta.fullDescription)
  const shouldRefreshCoreFeatures = refreshFeatures || hasImportFeature(meta.coreFeatures)
  const shouldRefreshAdditionalFeatures =
    refreshFeatures || hasImportFeature(meta.additionalFeatures)

  return {
    slug: meta.slug || '',
    name: meta.name || '',
    description: meta.description || '',
    category: meta.category || 'Uncategorized',
    parentCategory: meta.parentCategory || '',
    subcategory: meta.subcategory ?? null,
    stars: meta.stars || 0,
    watchers: meta.watchers || 0,
    addedDaysAgo: meta.addedDaysAgo ?? 0,
    license: meta.license || 'Unknown',
    lastCommit: meta.lastCommit || 'N/A',
    lastRelease: meta.lastRelease || 'N/A',
    version: meta.version || '',
    contributors: meta.contributors || 0,
    commitsThisYear: meta.commitsThisYear || 0,
    releases: meta.releases || 0,
    platforms: meta.platforms || ['Web'],
    deployment: meta.deployment || ['Cloud'],
    website: meta.website || '',
    docs: meta.docs || meta.website || '',
    sourceCode: meta.sourceCode || '',
    icon: meta.icon || meta.slug || '',
    verified: Boolean(meta.verified),
    featured: Boolean(meta.featured),
    tags: meta.tags || [],
    atGlance: meta.atGlance || '',
    fullDescription: shouldRefreshDescription ? fullDescriptionFor(meta) : meta.fullDescription,
    coreFeatures:
      !shouldRefreshCoreFeatures && meta.coreFeatures?.length
        ? meta.coreFeatures
        : details.coreFeatures,
    additionalFeatures:
      !shouldRefreshAdditionalFeatures && meta.additionalFeatures?.length
        ? meta.additionalFeatures
        : details.additionalFeatures,
    ...(meta.deployCompose ? { deployCompose: meta.deployCompose } : {}),
    similarTools:
      !refreshSimilar && meta.similarTools?.length ? meta.similarTools : details.similarTools,
  }
}

const sites = walkMetaFiles(sitesDir).map(filePath => ({
  filePath,
  meta: yaml.load(fs.readFileSync(filePath, 'utf8')) || {},
}))

let changed = 0
let scanned = 0

for (const site of sites) {
  if (onlyNew && site.meta.addedDaysAgo !== 0) continue
  if (parentFilter && site.meta.parentCategory !== parentFilter) continue
  if (subcategoryFilter && (site.meta.subcategory || '') !== subcategoryFilter) continue
  scanned += 1

  const details = context(site.meta)
  const nextMeta = orderedMeta(site.meta, {
    coreFeatures: featureObjects(details.core),
    additionalFeatures: featureObjects(details.extra),
    similarTools: similarToolsFor(site, sites),
  })

  const before = fs.readFileSync(site.filePath, 'utf8')
  const after = yaml.dump(nextMeta, {
    lineWidth: 100,
    noRefs: true,
    quotingType: '"',
    sortKeys: false,
  })

  if (before !== after) {
    changed += 1
    if (applyChanges) fs.writeFileSync(site.filePath, after)
  }
}

console.log(
  JSON.stringify(
    {
      mode: applyChanges ? 'apply' : 'dry-run',
      scanned,
      filesChanged: changed,
    },
    null,
    2
  )
)
