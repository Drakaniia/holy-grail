// Mirrored-behavior test: runs the real SPA search (useSmartSearch + Pinia
// stores) against the same corpus as the MCP scorer and asserts top-1
// parity on every corpus row. Both sides now score through @holy-grail/core;
// this test guards the parts each consumer still owns — the entity builders
// and the search wiring. Core-internal drift is structurally impossible.
//
// The SPA also searches navigation/collection items and locally-installed
// skills; the MCP corpus is catalog entities only. `/skills-index.json` is
// mocked empty (no local installs) so both sides search the same skill set.
// Extension/MCP rows are covered too, but only on the MCP side plus a
// "SPA still works" assertion — see the comment in the loop below.
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
    it(`SPA and port agree on top-1 for "${row.query}" (${row.expected_top1})`, async () => {
      const port = searchCatalog(row.query, 1, 0)
      expect(port.results[0]?.slug).toBe(row.expected_top1)
      expect(port.results[0]?.kind).toBe(row.kind)

      const spa = await runSpaSearch(row.query)

      if (row.kind === 'site' || row.kind === 'skill') {
        // The SPA corpus (navigation collections + sitesStore + skillsStore)
        // contains the same entities the MCP corpus builds, so top-1 must match.
        expect(spa).not.toBeNull()
        expect(spa!.slug).toBe(port.results[0]?.slug)
        expect(spa!.kind).toBe(row.kind)
      } else {
        // Extension/MCP rows have NO SPA counterpart: the SPA search corpus is
        // navigation collections + sites + skills only (see the note in
        // ../../mcp/evals/search-corpus.json), so the SPA can never surface a
        // result of these kinds and a top-1 comparison is structurally
        // impossible rather than merely untested. What is still asserted here
        // is that driving the real composable with the same query keeps working
        // through the shared core — a crash, an empty result set, or the
        // `site|skill` filter finding nothing would all fail here. The MCP
        // side's ranking of these rows is pinned by ../../mcp/evals/search-corpus.test.ts.
        expect(spa).not.toBeNull()
        expect(spa!.kind === 'site' || spa!.kind === 'skill').toBe(true)
      }
      // Each case re-scores the whole catalog on both engines, which takes
      // 2-5s — well past vitest's 5s default once all 12 rows run.
    }, 60_000)
  }

  afterEach(() => {
    vi.useRealTimers()
  })
})
