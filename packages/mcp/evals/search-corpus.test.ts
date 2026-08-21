// Pinned search-corpus test (runs with `bun test`, no framework deps).
// Asserts the ported scorer's top-1 matches the validated corpus expectations.
// Run: bun test mcp/evals/search-corpus.test.ts

import { describe, expect, it } from 'bun:test'
import { searchCatalog } from '../src/search.ts'
import corpus from './search-corpus.json'

describe('search corpus (ported scorer)', () => {
  for (const row of corpus.queries) {
    it(`top-1 for "${row.query}" is ${row.expected_top1} (${row.kind})`, () => {
      const page = searchCatalog(row.query, 1, 0)
      expect(page.results[0]?.slug).toBe(row.expected_top1)
      expect(page.results[0]?.kind).toBe(row.kind)
    })
  }
})
