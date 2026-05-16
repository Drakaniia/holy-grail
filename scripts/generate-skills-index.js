import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

const skillsDir = path.resolve('src/content/skills')
const outputPath = path.resolve('src/content/skills-index.json')

function buildSkillsIndex() {
  const skills = []
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const skillDir = path.join(skillsDir, entry.name)
    const yamlPath = path.join(skillDir, 'meta.yaml')

    if (!fs.existsSync(yamlPath)) continue

    const content = fs.readFileSync(yamlPath, 'utf-8')
    const meta = yaml.load(content) || {}

    skills.push({
      slug: meta.slug || entry.name,
      title: meta.title || entry.name,
      description: meta.description || '',
      category: meta.category || 'Uncategorized',
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
    })
  }

  // Sort by featured first, then by views descending
  skills.sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return b.views - a.views
  })

  fs.writeFileSync(outputPath, JSON.stringify(skills, null, 2))
  console.log(`Generated skills index with ${skills.length} skills`)
}

buildSkillsIndex()
