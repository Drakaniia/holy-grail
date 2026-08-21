<script setup lang="ts">
import { computed, nextTick, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowUpDown, CornerDownLeft, Search } from 'lucide-vue-next'
import SearchResultLogo from '@/components/search/SearchResultLogo.vue'
import { useSmartSearch, type SmartSearchResult } from '@/composables/useSmartSearch'
import { trackSearchQuery } from '@/lib/analytics'

const isOpen = defineModel<boolean>('open', { default: false })
const router = useRouter()
const query = shallowRef('')
const activeIndex = shallowRef(0)
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

const { hasQuery, results, searchTerms } = useSmartSearch(query)

const visibleResults = computed(() => results.value)
const activeResult = computed(() => visibleResults.value[activeIndex.value])
const resultHeading = computed(() => (hasQuery.value ? 'Best matches' : 'Featured paths'))

let previousBodyOverflow: string | null = null

// ---- Highlight matching terms ----

type TextSegment = { text: string; match: boolean }

const highlightCache = new Map<string, TextSegment[]>()
const MAX_HIGHLIGHT_CACHE = 200

function highlightText(raw: string): TextSegment[] {
  const terms = searchTerms.value
  if (!terms.length || !raw) return [{ text: raw, match: false }]

  const cacheKey = `${raw}|||${terms.join(',')}`
  const cached = highlightCache.get(cacheKey)
  if (cached) return cached

  const lower = raw.toLowerCase()
  // Collect all match ranges
  const ranges: { start: number; end: number }[] = []
  for (const term of terms) {
    let pos = 0
    while (pos < lower.length) {
      const idx = lower.indexOf(term, pos)
      if (idx === -1) break
      ranges.push({ start: idx, end: idx + term.length })
      pos = idx + 1
    }
  }

  if (!ranges.length) {
    const result = [{ text: raw, match: false }]
    highlightCache.set(cacheKey, result)
    return result
  }

  // Merge overlapping ranges
  ranges.sort((a, b) => a.start - b.start)
  const merged: typeof ranges = []
  for (const r of ranges) {
    const last = merged[merged.length - 1]
    if (last && r.start <= last.end) {
      last.end = Math.max(last.end, r.end)
    } else {
      merged.push({ ...r })
    }
  }

  // Build segments
  const segments: TextSegment[] = []
  let cursor = 0
  for (const r of merged) {
    if (r.start > cursor) {
      segments.push({ text: raw.slice(cursor, r.start), match: false })
    }
    segments.push({ text: raw.slice(r.start, r.end), match: true })
    cursor = r.end
  }
  if (cursor < raw.length) {
    segments.push({ text: raw.slice(cursor), match: false })
  }

  // Cache management
  if (highlightCache.size >= MAX_HIGHLIGHT_CACHE) {
    const firstKey = highlightCache.keys().next().value
    if (firstKey) highlightCache.delete(firstKey)
  }
  highlightCache.set(cacheKey, segments)
  return segments
}

// Pre-compute highlighted versions of visible results
const highlightedResults = computed(() =>
  visibleResults.value.map((r) => ({
    ...r,
    titleHighlights: highlightText(r.title),
    descriptionHighlights: highlightText(r.description),
  })),
)

// ---- Body scroll lock ----

watch(
  isOpen,
  async (open) => {
    if (typeof document === 'undefined') return
    if (open) {
      previousBodyOverflow ??= document.body.style.overflow
      document.body.style.overflow = 'hidden'
      await focusSearchInput()
      return
    }
    restoreBodyOverflow()
  },
  { immediate: true },
)

watch(query, () => {
  activeIndex.value = 0
  trackSearchQuery(query.value, 'command_palette')
})

watch(visibleResults, (currentResults) => {
  if (activeIndex.value >= currentResults.length) {
    activeIndex.value = Math.max(currentResults.length - 1, 0)
  }
})

onUnmounted(() => {
  restoreBodyOverflow()
})

function restoreBodyOverflow() {
  if (typeof document === 'undefined' || previousBodyOverflow === null) return
  document.body.style.overflow = previousBodyOverflow
  previousBodyOverflow = null
}

async function focusSearchInput() {
  await nextTick()
  searchInput.value?.focus({ preventScroll: true })
}

function closeDialog() {
  isOpen.value = false
}

function selectNextResult() {
  if (visibleResults.value.length === 0) return
  activeIndex.value = (activeIndex.value + 1) % visibleResults.value.length
}

function selectPreviousResult() {
  if (visibleResults.value.length === 0) return
  activeIndex.value =
    (activeIndex.value - 1 + visibleResults.value.length) % visibleResults.value.length
}

function openActiveResult() {
  openResult(activeResult.value)
}

function openResult(result: SmartSearchResult | undefined) {
  if (!result) return
  query.value = ''
  closeDialog()
  void router.push(result.to)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="command-palette">
      <div
        v-if="isOpen"
        class="cp-shell fixed inset-0 z-[90] flex items-start justify-center overflow-hidden px-4 pb-4 pt-[15vh] sm:pt-[18vh]"
        @keydown.esc.prevent="closeDialog"
      >
        <!-- Backdrop -->
        <button
          type="button"
          class="cp-backdrop fixed inset-0 bg-black/60 backdrop-blur-[1px]"
          aria-label="Close search"
          @click="closeDialog"
        />

        <!-- Panel -->
        <section
          class="cp-panel relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cp-title"
        >
          <!-- Search row -->
          <div class="flex h-14 items-center gap-3 border-b border-white/[0.07] px-4">
            <Search class="h-4.5 w-4.5 shrink-0 text-orange-400" />
            <label id="cp-title" class="sr-only" for="cp-input">Search Holy Grail</label>
            <input
              id="cp-input"
              ref="searchInput"
              v-model="query"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="Search sites, skills, collections..."
              class="h-full min-w-0 flex-1 bg-transparent text-[15px] text-white placeholder:text-white/25 focus:outline-none"
              @keydown.down.prevent="selectNextResult"
              @keydown.up.prevent="selectPreviousResult"
              @keydown.enter.prevent="openActiveResult"
            />
            <kbd
              class="hidden h-6 items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 text-[10px] text-white/30 sm:flex"
            >
              <span class="text-[11px] leading-none">esc</span>
            </kbd>
          </div>

          <!-- Meta row -->
          <div class="flex items-center justify-between border-b border-white/[0.06] px-4 py-2">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-white/30">
              {{ resultHeading }}
            </p>
            <p class="text-[11px] text-white/20">
              {{ visibleResults.length }} result{{ visibleResults.length !== 1 ? 's' : '' }}
            </p>
          </div>

          <!-- Results list -->
          <div
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5"
            role="listbox"
            aria-label="Search results"
          >
            <button
              v-for="(result, index) in highlightedResults"
              :key="result.id"
              type="button"
              class="cp-result group flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors duration-75"
              :class="
                index === activeIndex
                  ? 'cp-result--active border-white/[0.08] bg-white/[0.08]'
                  : 'cp-result--idle hover:bg-white/[0.04]'
              "
              role="option"
              :aria-selected="index === activeIndex"
              @mouseenter="activeIndex = index"
              @click="openResult(result)"
            >
              <SearchResultLogo
                :kind="result.kind"
                :title="result.title"
                :logo-url="result.logoUrl"
                :active="index === activeIndex"
              />

              <span class="min-w-0 flex-1">
                <!-- Title with match highlighting -->
                <span class="flex items-center gap-2">
                  <span class="truncate text-sm font-medium">
                    <template v-for="(seg, si) in result.titleHighlights" :key="si">
                      <mark
                        v-if="seg.match"
                        class="cp-mark rounded-sm bg-orange-500/25 text-orange-200"
                        >{{ seg.text }}</mark
                      >
                      <span v-else class="text-white">{{ seg.text }}</span>
                    </template>
                  </span>
                  <span
                    v-if="hasQuery"
                    class="shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide"
                    :class="
                      result.matchStrength === 'Direct'
                        ? 'border-green-500/30 bg-green-500/10 text-green-400'
                        : result.matchStrength === 'Close'
                          ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400'
                          : 'border-white/[0.08] bg-white/[0.04] text-white/30'
                    "
                  >
                    {{ result.matchStrength }}
                  </span>
                </span>

                <!-- Description with match highlighting -->
                <p class="mt-0.5 line-clamp-2 text-xs leading-relaxed">
                  <template v-for="(seg, si) in result.descriptionHighlights" :key="si">
                    <mark
                      v-if="seg.match"
                      class="cp-mark rounded-sm bg-orange-500/20 text-orange-200/80"
                      >{{ seg.text }}</mark
                    >
                    <span v-else class="text-white/40">{{ seg.text }}</span>
                  </template>
                </p>

                <!-- Chips row -->
                <span class="mt-1.5 flex flex-wrap items-center gap-1">
                  <span
                    v-if="result.domainLabel"
                    class="rounded bg-white/[0.05] px-1.5 py-0.5 text-[10px] text-white/35"
                  >
                    {{ result.domainLabel }}
                  </span>
                  <span
                    class="rounded border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[10px] tracking-wide text-white/35"
                  >
                    {{ result.eyebrow }}
                  </span>
                  <span
                    v-for="tag in result.tags.slice(0, 2)"
                    :key="`${result.id}-${tag}`"
                    class="rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-white/30"
                  >
                    {{ tag }}
                  </span>
                </span>
              </span>
            </button>

            <!-- Empty state -->
            <div
              v-if="visibleResults.length === 0 && hasQuery"
              class="flex flex-col items-center justify-center gap-2 py-14 text-center"
            >
              <Search class="h-8 w-8 text-white/10" />
              <p class="text-sm text-white/30">No results for "{{ query }}"</p>
              <p class="text-xs text-white/15">Try a different search term</p>
            </div>
          </div>

          <!-- Footer -->
          <div
            class="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] px-4 py-2.5 text-[11px] text-white/25"
          >
            <span class="truncate">
              {{ hasQuery ? 'Showing best matches' : 'Start typing to search' }}
            </span>
            <span class="flex shrink-0 items-center gap-3">
              <span class="inline-flex items-center gap-1">
                <ArrowUpDown class="h-3 w-3" />
                Navigate
              </span>
              <span class="inline-flex items-center gap-1">
                <CornerDownLeft class="h-3 w-3" />
                Open
              </span>
            </span>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ---- Panel ----
   Single gradient background without the expensive grid overlay.
   The old .command-palette-grid painted a repeating pattern on every frame.
*/

.cp-panel {
  max-height: min(540px, calc(100dvh - 20vh - 2rem));
  background:
    linear-gradient(180deg, rgba(255, 122, 0, 0.06), transparent 40%),
    linear-gradient(135deg, rgba(20, 184, 166, 0.04), transparent 30%), #1a1a1a;
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.04),
    0 24px 80px rgba(0, 0, 0, 0.6);
}

/* ---- Transitions ----
   Faster, leaner transitions with will-change hints.
*/

.command-palette-enter-active,
.command-palette-leave-active {
  transition: opacity 120ms ease;
}

.command-palette-enter-active .cp-panel,
.command-palette-leave-active .cp-panel {
  transition:
    opacity 120ms ease,
    transform 150ms cubic-bezier(0.16, 1, 0.3, 1);
}

.command-palette-enter-from,
.command-palette-leave-to {
  opacity: 0;
}

.command-palette-enter-from .cp-panel,
.command-palette-leave-to .cp-panel {
  opacity: 0;
  transform: translateY(-6px) scale(0.99);
}

/* ---- Light mode ----
   Clean custom properties approach instead of !important spam.
*/

:global(html.light .cp-panel) {
  background:
    linear-gradient(180deg, rgba(255, 122, 0, 0.1), transparent 44%),
    linear-gradient(135deg, rgba(20, 184, 166, 0.08), transparent 36%), #faf6f0;
  border-color: rgba(180, 160, 140, 0.7);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.4),
    0 24px 80px rgba(60, 40, 20, 0.2);
}

:global(html.light .cp-backdrop) {
  background: rgba(40, 30, 20, 0.3);
}

:global(html.light .cp-shell input) {
  color: #3d3226;
}

:global(html.light .cp-shell input::placeholder) {
  color: rgba(61, 50, 38, 0.3);
}

:global(html.light .cp-shell .border-white\/\[0\.07\]),
:global(html.light .cp-shell .border-white\/\[0\.06\]),
:global(html.light .cp-shell .border-white\/\[0\.08\]) {
  border-color: rgba(180, 160, 140, 0.5);
}

:global(html.light .cp-result--active) {
  border-color: rgba(255, 140, 26, 0.3);
  background: rgba(255, 140, 26, 0.1);
}

:global(html.light .cp-result--idle:hover) {
  background: rgba(255, 140, 26, 0.06);
}

:global(html.light .text-white\/30),
:global(html.light .text-white\/25),
:global(html.light .text-white\/20),
:global(html.light .text-white\/35) {
  color: rgba(61, 50, 38, 0.45);
}

:global(html.light .text-white\/40) {
  color: rgba(61, 50, 38, 0.55);
}

:global(html.light .bg-white\/\[0\.04\]),
:global(html.light .bg-white\/\[0\.03\]),
:global(html.light .bg-white\/\[0\.05\]),
:global(html.light .bg-white\/\[0\.08\]) {
  background: rgba(180, 160, 140, 0.15);
}

/* Match highlight */
.cp-mark {
  padding: 0 1px;
}

:global(html.light .cp-mark) {
  background: rgba(255, 140, 20, 0.22);
  color: #7a3a00;
}

/* Line clamp */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Reduce motion */
@media (prefers-reduced-motion: reduce) {
  .command-palette-enter-active,
  .command-palette-leave-active,
  .command-palette-enter-active .cp-panel,
  .command-palette-leave-active .cp-panel {
    transition: none;
  }
}
</style>
