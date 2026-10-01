import fs from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import { loadCatalogAddedDates, resolveAddedDaysAgo } from './catalog-added-dates.js'
import { findMetaYamlFiles } from '../lib/catalog.js'

const extensionsDir = path.resolve('src/content/extensions')
const outputPath = path.resolve('public/content/extensions-index.json')

function buildExtensionsIndex() {
  const extensions = []
  const metaFiles = findMetaYamlFiles(extensionsDir)
  const addedDates = loadCatalogAddedDates({
    kind: 'extensions',
    pathspecs: ['packages/web/src/content/extensions', 'src/content/extensions'],
  })

  for (const { yamlPath, parentCategory, subcategory } of metaFiles) {
    const content = fs.readFileSync(yamlPath, 'utf-8')
    const meta = parse(content) || {}
    const slug = meta.slug || path.basename(path.dirname(yamlPath))

    const ext = meta.extensionSpecific || {}

    extensions.push({
      slug,
      name: meta.name || '',
      description: meta.description || '',
      category: meta.category || 'Uncategorized',
      parentCategory: meta.parentCategory || parentCategory,
      subcategory: meta.subcategory !== undefined ? meta.subcategory : subcategory || null,
      version: meta.version || '',
      addedDaysAgo: resolveAddedDaysAgo(meta, slug, addedDates),
      license: meta.license || '',
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
      similarTools: (meta.similarTools || []).map((t) => ({
        slug: t.slug || '',
        name: t.name || '',
        description: t.description || '',
        stars: t.stars || 0,
        addedDaysAgo: t.addedDaysAgo || 0,
        verified: t.verified || false,
        website: t.website || '',
      })),
      chromeWebStoreId: ext.chromeWebStoreId || '',
      chromeWebStoreRating: ext.chromeWebStoreRating || 0,
      userCount: ext.userCount || 0,
      permissions: ext.permissions || [],
      manifestVersion: ext.manifestVersion || 3,
    })
  }

  extensions.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return (b.chromeWebStoreRating || 0) - (a.chromeWebStoreRating || 0)
  })

  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(extensions, null, 2))

  console.log(`Generated extensions index with ${extensions.length} extensions`)
}

buildExtensionsIndex()
