// Shared helpers for the catalog generators and enrichment scripts.
import fs from 'node:fs'
import path from 'node:path'

/** Recursively collects every `meta.yaml` under `dir`, tracking parent/subcategory from the path. */
export function findMetaYamlFiles(dir, parentCategory = '', subcategory = '') {
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

/** Flat list of every meta.yaml under `dir`, at any depth. */
export function walkMetaFiles(dir) {
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

/** Reads `--name value` or `--name=value` off process.argv; '' when absent. */
export function readOption(name) {
  const inline = process.argv.find((arg) => arg.startsWith(`${name}=`))
  if (inline) return inline.slice(name.length + 1)

  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : ''
}
