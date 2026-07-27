// src/services/grailInstaller.ts
// CLI wrapper service for the grail skill installer.

export type InstallStatus = 'idle' | 'copying' | 'copied' | 'installing' | 'installed' | 'error'

export async function copyInstallCommand(command: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(command)
    return true
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = command
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return true
  }
}

export function generateInstallCommand(repoLink: string, slug: string): string {
  return `npx tsx cli/grail.ts add ${repoLink} --skill ${slug}`
}

export async function checkSkillInstalled(slug: string): Promise<boolean> {
  try {
    const response = await fetch('/skills-index.json', { cache: 'no-cache' })
    if (!response.ok) return false
    const skills = (await response.json()) as Array<{ slug: string }>
    return skills.some((s) => s.slug === slug)
  } catch {
    return false
  }
}
