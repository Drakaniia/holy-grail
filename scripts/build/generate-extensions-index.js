import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const extensionsDir = path.resolve('src/content/extensions')
const outputPaths = [
  path.resolve('src/content/extensions-index.json'),
  path.resolve('public/content/extensions-index.json'),
]

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
        const nested = findMetaYamlFiles(fullPath, parentCategory || entry.name, entry.name)
        results.push(...nested)
      }
    }
  }

  return results
}

function buildExtensionsIndex() {
  const extensions = []
  const metaFiles = findMetaYamlFiles(extensionsDir)

  for (const { yamlPath, parentCategory, subcategory } of metaFiles) {
    const content = fs.readFileSync(yamlPath, 'utf-8')
    const meta = yaml.load(content) || {}

    const ext = meta.extensionSpecific || {}

    extensions.push({
      slug: meta.slug || path.basename(path.dirname(yamlPath)),
      name: meta.name || '',
      description: meta.description || '',
      category: meta.category || 'Uncategorized',
      parentCategory: meta.parentCategory || parentCategory,
      subcategory: meta.subcategory !== undefined ? meta.subcategory : subcategory || null,
      version: meta.version || '',
      addedDaysAgo: meta.addedDaysAgo || 0,
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
      installButtonBehavior: ext.installButtonBehavior || 'redirect-to-chrome-web-store',
    })
  }

  extensions.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return (b.chromeWebStoreRating || 0) - (a.chromeWebStoreRating || 0)
  })

  for (const outputPath of outputPaths) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(extensions, null, 2))
  }

  console.log(`Generated extensions index with ${extensions.length} extensions`)
}

buildExtensionsIndex()
