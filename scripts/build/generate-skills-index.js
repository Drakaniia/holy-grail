import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const skillsDir = path.resolve('src/content/skills')
const outputPaths = [
  path.resolve('src/content/skills-index.json'),
  path.resolve('public/content/skills-index.json'),
]

function findMetaYamlFiles(dir, parentCategory = '') {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      const yamlPath = path.join(fullPath, 'meta.yaml')
      if (fs.existsSync(yamlPath)) {
        results.push({ yamlPath, parentCategory })
      } else {
        const nested = findMetaYamlFiles(fullPath, entry.name)
        results.push(...nested)
      }
    }
  }

  return results
}

function buildSkillsIndex() {
  const skills = []
  const metaFiles = findMetaYamlFiles(skillsDir)

  for (const { yamlPath, parentCategory } of metaFiles) {
    const content = fs.readFileSync(yamlPath, 'utf-8')
    const meta = yaml.load(content) || {}
    const resolvedParentCategory =
      meta.parentCategory ||
      parentCategory ||
      (String(meta.category || '').toLowerCase() === 'design' ? 'design' : 'skills')

    skills.push({
      slug: meta.slug || path.basename(path.dirname(yamlPath)),
      title: meta.title || '',
      description: meta.description || '',
      category: meta.category || 'Uncategorized',
      parentCategory: resolvedParentCategory,
      tags: meta.tags || [],
      views: meta.views || 0,
      uses: meta.uses || 0,
      author: meta.author || '',
      authorName: meta.authorName || '',
      repoLink: meta.repoLink || '',
      skillPath: meta.skillPath || '',
      branch: meta.branch || 'main',
      addedBy: meta.addedBy || '',
      featured: meta.featured || false,
      dateAdded: meta.dateAdded || '',
      hasLocalContent: fs.existsSync(path.join(path.dirname(yamlPath), 'SKILL.md')),
    })
  }

  skills.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.views - a.views
  })

  for (const outputPath of outputPaths) {
    fs.mkdirSync(path.dirname(outputPath), { recursive: true })
    fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2))
  }

  console.log(`Generated skills index with ${skills.length} skills`)
}

buildSkillsIndex()
