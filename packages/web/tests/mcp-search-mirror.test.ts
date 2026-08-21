// Mirrored-behavior test: runs the real SPA search (useSmartSearch + Pinia
// stores) against the same corpus as the ported MCP scorer and asserts top-1
// parity on site/skill rows. Catches drift between mcp/src/search.ts and
// src/composables/useSmartSearch.ts.
//
// The SPA also searches navigation/collection items and locally-installed
// skills; the MCP corpus is catalog entities only. `/skills-index.json` is
// mocked empty (no local installs) so both sides search the same skill set.
// Run: bunx vitest run tests/mcp-search-mirror.test.ts

import { readFileSync } from 'node:fs'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useSmartSearch } from '../src/composables/useSmartSearch'
import { useSitesStore } from '../src/stores/sites'
import { useSkillsStore } from '../src/stores/skills'
import corpus from '../../mcp/evals/search-corpus.json'
import { searchCatalog } from '../../mcp/src/search'

const fixtures: Record<string, unknown> = {
  '/content/sites-index.json': JSON.parse(
    readFileSync(new URL('../public/content/sites-index.json', import.meta.url), 'utf-8'),
  ),
  '/content/skills-registry.json': JSON.parse(
    readFileSync(new URL('../public/content/skills-registry.json', import.meta.url), 'utf-8'),
  ),
  '/skills-index.json': [],
}

async function runSpaSearch(query: string): Promise<{ slug: string; kind: string } | null> {
  const q = ref(query)
  const { results } = useSmartSearch(q)
  // Drive the 80ms debounce deterministically with fake timers.
  await vi.advanceTimersByTimeAsync(80)
  // Navigation/collection items are SPA-only (the MCP corpus searches catalog
  // entities); compare against the SPA's top-ranked entity result.
  const top = results.value.find((r) => r.kind === 'site' || r.kind === 'skill')
  if (!top) return null
  return { slug: top.id.replace(/^(site|skill)-/, ''), kind: top.kind }
}

describe('SPA search parity (useSmartSearch vs ported scorer)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        const body = fixtures[url]
        if (body === undefined) return new Response('{}', { status: 404 })
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }),
    )
    const sites = useSitesStore()
    const skills = useSkillsStore()
    return Promise.all([sites.loadSites(), skills.loadSkills()])
  })

  for (const row of corpus.queries) {
    if (row.kind !== 'site' && row.kind !== 'skill') continue
    it(`SPA and port agree on top-1 for "${row.query}" (${row.expected_top1})`, async () => {
      const port = searchCatalog(row.query, 1, 0)
      expect(port.results[0]?.slug).toBe(row.expected_top1)

      const spa = await runSpaSearch(row.query)
      expect(spa).not.toBeNull()
      expect(spa!.slug).toBe(port.results[0]?.slug)
      expect(spa!.kind).toBe(row.kind)
    })
  }

  afterEach(() => {
    vi.useRealTimers()
  })
})
