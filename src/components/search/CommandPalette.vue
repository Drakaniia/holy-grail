<script setup lang="ts">
import { computed, nextTick, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowUpDown, Command, CornerDownLeft, Search, X } from 'lucide-vue-next'
import SearchResultLogo from '@/components/search/SearchResultLogo.vue'
import { useSmartSearch, type SmartSearchResult } from '@/composables/useSmartSearch'

const isOpen = defineModel<boolean>('open', { default: false })
const router = useRouter()
const query = shallowRef('')
const activeIndex = shallowRef(0)
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

const { hasQuery, results } = useSmartSearch(query)

const visibleResults = computed(() => results.value)
const activeResult = computed(() => visibleResults.value[activeIndex.value])
const resultHeading = computed(() => (hasQuery.value ? 'Best matches' : 'Featured paths'))

let previousBodyOverflow: string | null = null

watch(isOpen, async (open) => {
  if (typeof document === 'undefined') return

  if (open) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    await nextTick()
    searchInput.value?.focus()
    return
  }

  restoreBodyOverflow()
})

watch(query, () => {
  activeIndex.value = 0
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

  const targetRoute = result.to
  query.value = ''
  closeDialog()
  void router.push(targetRoute)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="command-palette">
      <div
        v-if="isOpen"
        class="command-palette-shell fixed inset-0 z-[90] flex items-center justify-center overflow-hidden px-3 py-4 text-white sm:py-6"
        @keydown.esc.prevent="closeDialog"
      >
        <button
          type="button"
          class="command-palette-backdrop fixed inset-0 bg-black/75 backdrop-blur-md"
          aria-label="Close search"
          @click="closeDialog"
        ></button>

        <section
          class="command-palette-panel relative flex w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-gray-800 shadow-[0_30px_90px_rgba(0,0,0,0.72)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
        >
          <div class="command-palette-grid pointer-events-none absolute inset-0"></div>

          <div
            class="command-palette-search-row relative flex h-16 items-center gap-3 border-b border-gray-800 px-4"
          >
            <Search class="h-5 w-5 shrink-0 text-accent-400" />
            <label id="command-palette-title" class="sr-only" for="command-palette-input">
              Search Holy Grail
            </label>
            <input
              id="command-palette-input"
              ref="searchInput"
              v-model="query"
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="Search sites, skills, categories..."
              class="command-palette-input h-full min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-gray-600 focus:outline-none"
              @keydown.down.prevent="selectNextResult"
              @keydown.up.prevent="selectPreviousResult"
              @keydown.enter.prevent="openActiveResult"
            />
            <button
              type="button"
              class="command-palette-close-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="Close search"
              @click="closeDialog"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <div
            class="command-palette-meta-row relative flex items-center justify-between border-b border-gray-800 px-4 py-2"
          >
            <div class="flex min-w-0 items-center gap-2">
              <Command class="h-3.5 w-3.5 shrink-0 text-gray-500" />
              <p
                class="command-palette-meta-label truncate text-xs font-medium uppercase tracking-widest text-gray-500"
              >
                {{ resultHeading }}
              </p>
            </div>
            <p class="command-palette-result-count shrink-0 text-xs text-gray-600">
              {{ visibleResults.length }} results
            </p>
          </div>

          <div
            class="relative min-h-0 flex-1 overflow-y-auto p-2"
            role="listbox"
            aria-label="Smart search results"
          >
            <button
              v-for="(result, index) in visibleResults"
              :key="result.id"
              type="button"
              class="command-palette-result group flex w-full items-start gap-3 rounded-md border border-transparent px-3 py-3 text-left transition-colors"
              :class="
                index === activeIndex
                  ? 'command-palette-result--active border-gray-700 bg-white/[0.07] text-white'
                  : 'command-palette-result--idle text-gray-300 hover:bg-white/[0.045]'
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
                <span class="flex min-w-0 items-center gap-2">
                  <span
                    class="command-palette-result-title truncate text-sm font-semibold text-white"
                  >
                    {{ result.title }}
                  </span>
                  <span
                    v-if="hasQuery"
                    class="command-palette-match-pill shrink-0 rounded border border-gray-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500"
                  >
                    {{ result.matchStrength }}
                  </span>
                </span>
                <span
                  class="command-palette-result-description mt-1 block line-clamp-2 text-xs leading-5 text-gray-500"
                >
                  {{ result.description }}
                </span>
                <span class="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                  <span
                    class="command-palette-chip rounded border border-gray-800 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-gray-500"
                  >
                    {{ result.eyebrow }}
                  </span>
                  <span
                    v-for="tag in result.tags.slice(0, 2)"
                    :key="`${result.id}-${tag}`"
                    class="command-palette-tag rounded bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-gray-500"
                  >
                    {{ tag }}
                  </span>
                </span>
              </span>
            </button>
          </div>

          <div
            class="command-palette-footer relative flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 px-4 py-3 text-xs text-gray-600"
          >
            <span class="min-w-0 truncate">
              {{ hasQuery ? 'Showing closest ranked results' : 'Start typing for fuzzy matching' }}
            </span>
            <span class="flex shrink-0 items-center gap-3">
              <span class="inline-flex items-center gap-1">
                <ArrowUpDown class="h-3.5 w-3.5" />
                Move
              </span>
              <span class="inline-flex items-center gap-1">
                <CornerDownLeft class="h-3.5 w-3.5" />
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
.command-palette-panel {
  max-height: min(660px, calc(100dvh - 2rem));
  background:
    linear-gradient(180deg, rgba(255, 122, 0, 0.08), transparent 42%),
    linear-gradient(135deg, rgba(20, 184, 166, 0.06), transparent 34%), #050505;
}

.command-palette-grid {
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);
  background-size: 28px 28px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.75), transparent 72%);
  opacity: 0.42;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.command-palette-enter-active,
.command-palette-leave-active {
  transition: opacity 180ms ease;
}

.command-palette-enter-active .command-palette-panel,
.command-palette-leave-active .command-palette-panel {
  transition:
    opacity 180ms ease,
    transform 200ms ease;
}

.command-palette-enter-from,
.command-palette-leave-to {
  opacity: 0;
}

.command-palette-enter-from .command-palette-panel,
.command-palette-leave-to .command-palette-panel {
  opacity: 0;
  transform: translateY(-10px) scale(0.985);
}

:global(html.light .command-palette-panel) {
  background:
    linear-gradient(180deg, rgba(255, 122, 0, 0.16), transparent 44%),
    linear-gradient(135deg, rgba(20, 184, 166, 0.1), transparent 36%), var(--mocha-surface);
  border-color: rgba(203, 182, 162, 0.9);
  color: var(--mocha-text);
  box-shadow:
    0 30px 90px rgba(75, 49, 28, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.62);
}

:global(html.light .command-palette-grid) {
  background-image:
    linear-gradient(rgba(45, 33, 25, 0.07) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 33, 25, 0.06) 1px, transparent 1px);
  opacity: 0.32;
}

:global(html.light .command-palette-backdrop) {
  background: rgba(45, 33, 25, 0.34);
}

:global(html.light .command-palette-search-row),
:global(html.light .command-palette-meta-row),
:global(html.light .command-palette-footer) {
  border-color: rgba(203, 182, 162, 0.78) !important;
}

:global(html.light .command-palette-input) {
  color: var(--mocha-text) !important;
}

:global(html.light .command-palette-input::placeholder) {
  color: var(--mocha-muted) !important;
}

:global(html.light .command-palette-close-button) {
  color: var(--mocha-muted) !important;
}

:global(html.light .command-palette-close-button:hover) {
  background: rgba(255, 140, 26, 0.12) !important;
  color: var(--mocha-text) !important;
}

:global(html.light .command-palette-meta-label),
:global(html.light .command-palette-result-count),
:global(html.light .command-palette-footer) {
  color: var(--mocha-muted) !important;
}

:global(html.light .command-palette-result) {
  color: var(--mocha-text-soft) !important;
}

:global(html.light .command-palette-result--idle:hover) {
  background: rgba(255, 140, 26, 0.09) !important;
}

:global(html.light .command-palette-result--active) {
  border-color: rgba(255, 140, 26, 0.34) !important;
  background: rgba(255, 140, 26, 0.13) !important;
  color: var(--mocha-text) !important;
}

:global(html.light .command-palette-result-title) {
  color: var(--mocha-text) !important;
}

:global(html.light .command-palette-result-description) {
  color: var(--mocha-muted) !important;
}

:global(html.light .command-palette-match-pill),
:global(html.light .command-palette-chip) {
  border-color: rgba(203, 182, 162, 0.82) !important;
  background: rgba(255, 250, 243, 0.52);
  color: var(--mocha-muted) !important;
}

:global(html.light .command-palette-tag) {
  background: rgba(45, 33, 25, 0.06) !important;
  color: var(--mocha-muted) !important;
}
</style>
