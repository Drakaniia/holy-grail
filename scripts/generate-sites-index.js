import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const sitesDir = path.resolve('src/content/sites')
const outputPath = path.resolve('src/content/sites-index.json')

function buildSitesIndex() {
  const sites = []
  const entries = fs.readdirSync(sitesDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const siteDir = path.join(sitesDir, entry.name)
    const yamlPath = path.join(siteDir, 'meta.yaml')

    if (!fs.existsSync(yamlPath)) continue

    const content = fs.readFileSync(yamlPath, 'utf-8')
    const meta = yaml.load(content) || {}

    sites.push({
      slug: meta.slug || entry.name,
      name: meta.name || entry.name,
      description: meta.description || '',
      category: meta.category || 'Uncategorized',
      stars: meta.stars || 0,
      watchers: meta.watchers || 0,
      addedDaysAgo: meta.addedDaysAgo || 0,
      license: meta.license || '',
      lastCommit: meta.lastCommit || '',
      lastRelease: meta.lastRelease || '',
      version: meta.version || '',
      contributors: meta.contributors || 0,
      commitsThisYear: meta.commitsThisYear || 0,
      releases: meta.releases || 0,
      platforms: meta.platforms || [],
      deployment: meta.deployment || [],
      website: meta.website || '',
      docs: meta.docs || '',
      sourceCode: meta.sourceCode || '',
      icon: meta.icon || '',
      verified: meta.verified || false,
      featured: meta.featured || false,
      atGlance: meta.atGlance || '',
      fullDescription: meta.fullDescription || '',
      coreFeatures: meta.coreFeatures || [],
      additionalFeatures: meta.additionalFeatures || [],
      deployCompose: meta.deployCompose || '',
      similarTools: (meta.similarTools || []).map(t => ({
        slug: t.slug || '',
        name: t.name || '',
        description: t.description || '',
        stars: t.stars || 0,
        addedDaysAgo: t.addedDaysAgo || 0,
        verified: t.verified || false,
        website: t.website || '',
      })),
    })
  }

  // Sort by featured first, then by stars descending
  sites.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.stars - a.stars
  })

  fs.writeFileSync(outputPath, JSON.stringify(sites, null, 2))
  console.log(`Generated sites index with ${sites.length} sites`)
}

buildSitesIndex()
