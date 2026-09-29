<script setup lang="ts">
import { computed, defineAsyncComponent, shallowRef, useTemplateRef } from 'vue'
import { ChevronLeft, PanelLeftClose, Search } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import holyGrailLogo from '@/assets/holy-grail.png'

const SidebarAccountMenu = defineAsyncComponent(
  () => import('@/components/auth/SidebarAccountMenu.vue'),
)

const props = withDefaults(
  defineProps<{
    title: string
    query: string
    searchMode?: boolean
    collapsible?: boolean
    isAuthenticated?: boolean
    /** The stack has somewhere to pop back to; at the root the row is a plain label, not a button. */
    canGoBack?: boolean
  }>(),
  {
    searchMode: false,
    collapsible: true,
    isAuthenticated: false,
    canGoBack: false,
  },
)

const emit = defineEmits<{
  back: []
  collapse: []
  clear: []
  'update:query': [query: string]
}>()

const searchInput = useTemplateRef<HTMLInputElement>('searchInput')
const isFocused = shallowRef(false)

/** The title row is chrome for a pushed view or search mode; the root column has none. */
const showTitleRow = computed(() => props.canGoBack || props.searchMode)

function handleInput(event: Event) {
  emit('update:query', (event.target as HTMLInputElement).value)
}

function handleClear() {
  emit('update:query', '')
  emit('clear')
}

function focusSearch() {
  searchInput.value?.focus()
}

function blurSearch() {
  searchInput.value?.blur()
}

defineExpose({ isFocused, focusSearch, blurSearch })
</script>

<template>
  <div class="shrink-0">
    <!-- Context row: animates its grid track to 0fr while searching instead of measuring height. -->
    <div
      class="grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
      :class="props.searchMode ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'"
    >
      <div class="min-h-0 overflow-hidden">
        <div
          class="flex items-center gap-1 p-2 pt-1.5 pl-2.5"
          :inert="props.searchMode ? true : undefined"
        >
          <SidebarAccountMenu v-if="props.isAuthenticated" class="min-w-0 flex-1" />

          <RouterLink
            v-else
            to="/"
            class="inline-flex h-7 min-w-0 flex-1 items-center gap-2 rounded-lg px-2 text-sidebar-foreground transition-[background-color,transform] duration-150 hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            aria-label="Holy Grail home"
          >
            <img :src="holyGrailLogo" alt="" class="h-5 w-5 shrink-0 rounded" />
            <span class="truncate text-sm font-bold tracking-tight uppercase">Holy Grail</span>
          </RouterLink>

          <!-- Invisible at rest; revealed when the column is hovered or tabbed into. -->
          <div
            v-if="props.collapsible"
            class="shrink-0 scale-95 opacity-0 transition-all duration-300 ease-in-out group-hover/sidebar:scale-100 group-hover/sidebar:opacity-100 focus-within:scale-100 focus-within:opacity-100 motion-reduce:transition-none"
          >
            <button
              type="button"
              class="inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-sidebar-muted-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60"
              aria-label="Collapse sidebar"
              title="Collapse sidebar (Ctrl+B)"
              @click="emit('collapse')"
            >
              <PanelLeftClose class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!--
      Title row. It only exists once there is somewhere to go back to (a pushed section) or a mode
      to leave (search) — at the root the column goes logo, search, list, with no dead row in
      between. Collapsing it through a grid track animates the height instead of snapping it.
    -->
    <div
      class="grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
      :class="showTitleRow ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'"
      :aria-hidden="showTitleRow ? undefined : true"
    >
      <div class="min-h-0 overflow-hidden">
        <div class="flex items-center px-2 pb-1" :inert="showTitleRow ? undefined : true">
          <button
            v-if="!props.searchMode"
            type="button"
            class="flex w-full cursor-pointer items-center justify-between gap-1 rounded-md px-0.5 py-0.5 text-sm text-sidebar-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            aria-label="Back to main menu"
            @click="emit('back')"
          >
            <span class="grid size-8 flex-none place-content-center">
              <ChevronLeft class="h-4 w-4" />
            </span>
            <span class="min-w-0 flex-1 truncate text-center font-medium">{{ props.title }}</span>
            <span class="size-8 flex-none" />
          </button>

          <div v-else class="flex w-full items-center justify-between gap-1 px-0.5 py-0.5 text-sm">
            <span class="grid size-8 flex-none place-content-center text-sidebar-muted-foreground">
              <Search class="h-4 w-4" />
            </span>
            <span class="min-w-0 flex-1 truncate text-center font-medium text-sidebar-foreground">
              Search
            </span>
            <button
              type="button"
              class="size-8 flex-none cursor-pointer rounded-md text-xs font-medium text-sidebar-muted-foreground transition-[background-color,color,transform] duration-150 hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
              @click="handleClear"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Search field: readonly until focused, so the `/` kbd hint is the resting affordance. -->
    <div class="px-2 pb-2">
      <form class="relative" @submit.prevent>
        <label class="sr-only" for="sidebar-tab-search">Search catalog tabs</label>
        <Search
          class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-sidebar-muted-foreground/40"
        />
        <input
          id="sidebar-tab-search"
          ref="searchInput"
          data-sidebar-search
          type="text"
          autocomplete="off"
          spellcheck="false"
          :readonly="!isFocused"
          :value="props.query"
          placeholder="Search tabs"
          class="h-8 w-full cursor-text rounded-md border-0 bg-sidebar-raised pr-12 pl-9 text-sm text-sidebar-foreground outline-none transition-colors placeholder:text-sidebar-muted-foreground/40 hover:bg-sidebar-raised/80 focus-visible:ring-2 focus-visible:ring-sidebar-ring/60"
          @focus="isFocused = true"
          @blur="isFocused = false"
          @input="handleInput"
          @keydown.esc.prevent="handleClear"
        />
        <kbd
          v-if="!isFocused && !props.query"
          class="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs font-medium tracking-wide text-sidebar-muted-foreground/60 uppercase"
        >
          /
        </kbd>
      </form>
    </div>
  </div>
</template>
