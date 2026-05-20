import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const sitesDir = path.resolve('src/content/sites')
const outputPath = path.resolve('src/content/sites-index.json')

function findMetaYamlFiles(dir, parentCategory = '', subcategory = '') {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      const yamlPath = path.join(fullPath, 'meta.yaml')
      if (fs.existsSync(yamlPath)) {
        results.push({ yamlPath, parentCategory, subcategory: subcategory || null })
      } else {
        const nested = findMetaYamlFiles(
          fullPath,
          parentCategory || entry.name,
          entry.name
        )
        results.push(...nested)
      }
    }
  }

  return results
}

function buildSitesIndex() {
  const sites = []
  const metaFiles = findMetaYamlFiles(sitesDir)

  for (const { yamlPath, parentCategory, subcategory } of metaFiles) {
    const content = fs.readFileSync(yamlPath, 'utf-8')
    const meta = yaml.load(content) || {}

    sites.push({
      slug: meta.slug || path.basename(path.dirname(yamlPath)),
      name: meta.name || '',
      description: meta.description || '',
      category: meta.category || 'Uncategorized',
      parentCategory: meta.parentCategory || parentCategory,
      subcategory: meta.subcategory !== undefined ? meta.subcategory : (subcategory || null),
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
      tags: meta.tags || [],
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

  sites.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.stars - a.stars
  })

  fs.writeFileSync(outputPath, JSON.stringify(sites, null, 2))
  console.log(`Generated sites index with ${sites.length} sites`)
}

buildSitesIndex()
