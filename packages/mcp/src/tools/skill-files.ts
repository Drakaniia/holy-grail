// get_skill_files (all transports) + install_skill (stdio only).
//
// get_skill_files returns a skill's SKILL.md and supporting files so any agent
// can write them itself — the hosted endpoint cannot touch the user's disk.
// install_skill is registered only for the local stdio server, where the
// process runs on the user's machine, and writes the files into a skills dir.

import { existsSync } from 'node:fs'
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, isAbsolute, resolve, sep } from 'node:path'
import type { McpServer as SdkMcpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { SKILL_FILES_CHARACTER_LIMIT } from '../constants.js'
import { ensureCatalog, loadSkills } from '../data.js'
import { installHint } from '../format.js'
import {
  fetchSkillBundle,
  isSafeRelativePath,
  type SkillBundle,
  type SkillFile,
} from '../skill-files.js'
import { fail, notFound, ok } from './common.js'

const slugSchema = z
  .string()
  .min(1)
  .describe(
    'Skill slug, e.g. "audit-codebase". Find valid slugs via search (kind="skill") or list_skills',
  )

function installTargets(slug: string) {
  return {
    claude_project: `.claude/skills/${slug}/`,
    claude_user: `~/.claude/skills/${slug}/`,
    agents_project: `.agents/skills/${slug}/`,
    agents_user: `~/.agents/skills/${slug}/`,
  }
}

function fence(content: string, path: string): string {
  const longest = Math.max(2, ...[...content.matchAll(/`+/g)].map((m) => m[0].length))
  const ticks = '`'.repeat(longest + 1)
  const ext = path.includes('.') ? path.slice(path.lastIndexOf('.') + 1).toLowerCase() : ''
  const lang = ext === 'md' ? 'markdown' : ext === 'py' ? 'python' : ext === 'sh' ? 'bash' : ext
  return `${ticks}${lang}\n${content}${content.endsWith('\n') ? '' : '\n'}${ticks}`
}

interface FileView {
  path: string
  size: number
  encoding: SkillFile['encoding']
  content?: string
  omitted?: string
}

function budgetFiles(files: SkillFile[]): FileView[] {
  let used = 0
  return files.map((file) => {
    const cost = file.content.length + file.path.length + 40
    if (used + cost > SKILL_FILES_CHARACTER_LIMIT) {
      return {
        path: file.path,
        size: file.size,
        encoding: file.encoding,
        omitted: `response size limit — call get_skill_files with path="${file.path}"`,
      }
    }
    used += cost
    return { path: file.path, size: file.size, encoding: file.encoding, content: file.content }
  })
}

function bundleMarkdown(bundle: SkillBundle, views: FileView[], hint: string): string {
  const targets = installTargets(bundle.slug)
  const lines = [
    `# Skill files: ${bundle.slug}`,
    '',
    `Source: ${bundle.sourceUrl} (${bundle.files.length} file${bundle.files.length === 1 ? '' : 's'})`,
    '',
    '## Install',
    '',
    `Write every file below into a folder named \`${bundle.slug}\` inside your agent's skills directory, preserving relative paths:`,
    `- Claude Code: \`${targets.claude_project}\` (this project) or \`${targets.claude_user}\` (all projects)`,
    `- Other agents using the .agents convention: \`${targets.agents_project}\` or \`${targets.agents_user}\``,
    `- Base64-encoded files must be decoded before writing.`,
    `- Or run: \`${hint}\``,
  ]
  if (bundle.partial) {
    lines.push(
      '',
      '_Only SKILL.md could be fetched (GitHub listing unavailable); supporting files may be missing._',
    )
  }
  if (bundle.skipped.length > 0) {
    lines.push('', '## Skipped', '', ...bundle.skipped.map((s) => `- \`${s.path}\` — ${s.reason}`))
  }
  lines.push('', '## Files')
  for (const view of views) {
    lines.push(
      '',
      `### ${view.path} (${view.size.toLocaleString()} bytes${view.encoding === 'base64' ? ', base64' : ''})`,
      '',
    )
    lines.push(
      view.content !== undefined ? fence(view.content, view.path) : `_Omitted: ${view.omitted}_`,
    )
  }
  return lines.join('\n')
}

export function registerSkillFileTools(
  server: SdkMcpServer,
  options: { canInstallSkills: boolean },
): void {
  server.registerTool(
    'get_skill_files',
    {
      title: 'Get Skill Files',
      description: `Download a catalog skill's files from GitHub — SKILL.md plus supporting files (scripts, references, assets) — with install instructions. Use it to install a skill by writing the files yourself, or to read what a skill does before installing.${options.canInstallSkills ? ' On this local server, install_skill can write them to disk for you.' : ''}

Args:
  - slug (string): Skill slug, e.g. "audit-codebase"
  - path (string, optional): Return only this file (relative to the skill folder), e.g. "scripts/run.py"
  - include_content (boolean): false = file list only (default: true)

Returns:
  { "slug", "repo", "branch", "skillDir", "sourceUrl", "installTargets": {...}, "installCommand", "partial": boolean, "files": [{ "path", "size", "encoding": "utf-8"|"base64", "content"?, "omitted"? }], "skipped": [{ "path", "reason" }] }
  Large skills: later files are listed with "omitted" — fetch them one by one with path.

Error Handling:
  - Unknown slug -> use search / list_skills
  - GitHub unreachable or SKILL.md missing -> error with the paths tried`,
      inputSchema: z
        .object({
          slug: slugSchema,
          path: z
            .string()
            .min(1)
            .max(300)
            .optional()
            .describe('Only return this file, e.g. "SKILL.md"'),
          include_content: z
            .boolean()
            .default(true)
            .describe('false = list files without contents'),
        })
        .strict(),
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      await ensureCatalog()
      const skill = loadSkills().find((s) => s.slug === params.slug)
      if (!skill) return notFound('skill', params.slug)
      let bundle: SkillBundle
      try {
        bundle = await fetchSkillBundle(skill)
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error))
      }
      const hint = installHint(skill)
      let files = bundle.files
      if (params.path) {
        files = files.filter((f) => f.path === params.path)
        if (files.length === 0) {
          return fail(
            `No file '${params.path}' in skill '${skill.slug}'. Available: ${bundle.files.map((f) => f.path).join(', ')}`,
          )
        }
      }
      const views: FileView[] = params.include_content
        ? budgetFiles(files)
        : files.map((f) => ({ path: f.path, size: f.size, encoding: f.encoding }))
      const payload = {
        slug: bundle.slug,
        repo: bundle.repo,
        branch: bundle.branch,
        skillDir: bundle.skillDir,
        sourceUrl: bundle.sourceUrl,
        installTargets: installTargets(bundle.slug),
        installCommand: hint,
        partial: bundle.partial,
        files: views,
        skipped: bundle.skipped,
      }
      return ok(bundleMarkdown(bundle, views, hint), payload)
    },
  )

  if (!options.canInstallSkills) return

  server.registerTool(
    'install_skill',
    {
      title: 'Install Skill Locally',
      description: `Download a catalog skill from GitHub and write it into a skills directory on this machine (local stdio server only). Creates <skills-dir>/<slug>/ with SKILL.md and its supporting files.

Ask the user where to install before calling (agent and project vs user scope) unless they already said.

Args:
  - slug (string): Skill slug, e.g. "audit-codebase"
  - target ('claude' | 'agents' | 'custom'): 'claude' = .claude/skills, 'agents' = .agents/skills, 'custom' = the given directory (default: 'claude')
  - scope ('project' | 'user'): project = relative to the project directory, user = home directory (default: 'project'; ignored for 'custom')
  - directory (string, required for 'custom'): Skills directory; the skill goes into <directory>/<slug>/
  - overwrite (boolean): Replace an existing installation of this skill (default: false)

Returns:
  { "installed": true, "path": string, "files": string[], "skipped": [...], "partial": boolean }

The project directory is HOLY_GRAIL_PROJECT_DIR if set, else the server's working directory (normally the workspace your MCP client started it in).`,
      inputSchema: z
        .object({
          slug: slugSchema,
          target: z
            .enum(['claude', 'agents', 'custom'])
            .default('claude')
            .describe(
              "'claude' (.claude/skills), 'agents' (.agents/skills) or 'custom' (default: 'claude')",
            ),
          scope: z
            .enum(['project', 'user'])
            .default('project')
            .describe(
              "'project' (project directory) or 'user' (home directory) (default: 'project')",
            ),
          directory: z
            .string()
            .min(1)
            .max(500)
            .optional()
            .describe(
              'Skills directory for target="custom" (absolute, or relative to the project directory)',
            ),
          overwrite: z
            .boolean()
            .default(false)
            .describe('Replace an existing installation of this skill (default: false)'),
        })
        .strict(),
      annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (params) => {
      await ensureCatalog()
      const skill = loadSkills().find((s) => s.slug === params.slug)
      if (!skill) return notFound('skill', params.slug)
      if (!/^[a-z0-9][a-z0-9._-]*$/i.test(skill.slug) || skill.slug.includes('..')) {
        return fail(`Skill slug '${skill.slug}' is not safe to use as a folder name.`)
      }

      const projectDir = resolve(process.env.HOLY_GRAIL_PROJECT_DIR?.trim() || process.cwd())
      let skillsDir: string
      if (params.target === 'custom') {
        if (!params.directory) return fail('target="custom" requires directory.')
        skillsDir = isAbsolute(params.directory)
          ? resolve(params.directory)
          : resolve(projectDir, params.directory)
      } else {
        const base = params.scope === 'user' ? homedir() : projectDir
        skillsDir = resolve(base, params.target === 'claude' ? '.claude' : '.agents', 'skills')
      }
      const dest = resolve(skillsDir, skill.slug)

      if (existsSync(dest)) {
        const entries = await readdir(dest).catch(() => [] as string[])
        if (entries.length > 0) {
          if (!params.overwrite) {
            return fail(`'${dest}' already exists. Call again with overwrite=true to replace it.`)
          }
          if (!entries.includes('SKILL.md')) {
            return fail(
              `'${dest}' exists but does not look like a skill (no SKILL.md); refusing to replace it.`,
            )
          }
        }
      }

      let bundle: SkillBundle
      try {
        bundle = await fetchSkillBundle(skill)
      } catch (error) {
        return fail(error instanceof Error ? error.message : String(error))
      }

      const writes: Array<{ target: string; file: SkillFile }> = []
      for (const file of bundle.files) {
        const target = resolve(dest, ...file.path.split('/'))
        if (!isSafeRelativePath(file.path) || !target.startsWith(dest + sep)) {
          return fail(`Refusing to write '${file.path}': path escapes the skill folder.`)
        }
        writes.push({ target, file })
      }

      try {
        if (existsSync(dest) && params.overwrite) await rm(dest, { recursive: true, force: true })
        for (const { target, file } of writes) {
          await mkdir(dirname(target), { recursive: true })
          await writeFile(
            target,
            file.encoding === 'base64' ? Buffer.from(file.content, 'base64') : file.content,
          )
        }
      } catch (error) {
        return fail(
          `Failed writing to ${dest}: ${error instanceof Error ? error.message : String(error)}`,
        )
      }

      const payload = {
        installed: true,
        path: dest,
        files: bundle.files.map((f) => f.path),
        skipped: bundle.skipped,
        partial: bundle.partial,
        sourceUrl: bundle.sourceUrl,
      }
      const lines = [
        `Installed **${skill.title}** into \`${dest}\` (${bundle.files.length} file${bundle.files.length === 1 ? '' : 's'}).`,
        '',
        ...bundle.files.map((f) => `- ${f.path}`),
      ]
      if (bundle.skipped.length > 0) {
        lines.push('', 'Skipped:', ...bundle.skipped.map((s) => `- ${s.path} — ${s.reason}`))
      }
      if (bundle.partial)
        lines.push('', '_Only SKILL.md was available; supporting files may be missing._')
      lines.push(
        '',
        'Restart or reload your agent if it does not pick up new skills automatically.',
      )
      return ok(lines.join('\n'), payload)
    },
  )
}
