<script setup lang="ts">
import { computed, shallowRef, useTemplateRef } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDown } from 'lucide-vue-next'
import type { SidebarScope } from './sidebarNav'
import SidebarDisclosure from './SidebarDisclosure.vue'
import SidebarNavRow from './SidebarNavRow.vue'
import SidebarScrollFades from './SidebarScrollFades.vue'
import type {
  SidebarSearchGroup,
  SidebarSearchSort,
  SidebarSearchSortOption,
  SidebarScopeOption,
} from './useSidebarSearch'

const props = defineProps<{
  query: string
  scope: SidebarScope
  sort: SidebarSearchSort
  resultGroups: SidebarSearchGroup[]
  resultCount: number
  hasQuery: boolean
  scopeOptions: SidebarScopeOption[]
  sortOptions: SidebarSearchSortOption[]
}>()

const emit = defineEmits<{
  'update:scope': [scope: SidebarScope]
  'update:sort': [sort: SidebarSearchSort]
}>()

const route = useRoute()
const scroller = useTemplateRef<HTMLElement>('scroller')
const isSortOpen = shallowRef(false)

const activeSortName = computed(
  () => props.sortOptions.find((option) => option.key === props.sort)?.name ?? 'Best match',
)

function isActive(path: string) {
  return route.path === path
}
</script>

<template>
  <div class="absolute inset-0 flex flex-col">
    <div class="shrink-0 px-2 pt-1 pb-1">
      <div
        class="flex flex-wrap items-center gap-1 px-1"
        role="radiogroup"
        aria-label="Search scope"
      >
        <label
          v-for="option in props.scopeOptions"
          :key="option.key"
          class="inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-full px-2 text-xs font-medium transition-[background-color,color,transform] duration-150 has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          :class="
            props.scope === option.key
              ? 'bg-sidebar-press text-sidebar-foreground'
              : 'text-sidebar-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground'
          "
        >
          <input
            class="sr-only"
            type="radio"
            name="sidebar-search-scope"
            :value="option.key"
            :checked="props.scope === option.key"
            @change="emit('update:scope', option.key)"
          />
          <component :is="option.icon" class="h-3.5 w-3.5" />
          <span :class="props.scope === option.key ? '' : 'sr-only'">{{ option.name }}</span>
        </label>
      </div>

      <button
        id="sidebar-sort-button"
        type="button"
        class="group/filter-header flex h-7 w-full min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-left text-sm/5 font-medium text-sidebar-foreground/90 transition-colors hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
        :aria-expanded="isSortOpen"
        aria-controls="sidebar-sort-region"
        @click="isSortOpen = !isSortOpen"
      >
        <ChevronDown
          class="h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none"
          :class="{ '-rotate-90': !isSortOpen }"
        />
        <span class="truncate">Sort: {{ activeSortName }}</span>
      </button>

      <SidebarDisclosure
        id="sidebar-sort-region"
        :open="isSortOpen"
        labelledby="sidebar-sort-button"
      >
        <div class="flex flex-col gap-px px-1 pb-1" role="radiogroup" aria-label="Sort results">
          <label
            v-for="option in props.sortOptions"
            :key="option.key"
            class="flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 text-sidebar-foreground/75 transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground has-[:focus-visible]:outline-2 has-[:focus-visible]:-outline-offset-1 has-[:focus-visible]:outline-sidebar-ring/60 active:bg-sidebar-press active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
            :class="props.sort === option.key ? 'bg-sidebar-press text-sidebar-foreground' : ''"
          >
            <input
              class="sr-only"
              type="radio"
              name="sidebar-search-sort"
              :value="option.key"
              :checked="props.sort === option.key"
              @change="emit('update:sort', option.key)"
            />
            <span
              aria-hidden="true"
              class="flex size-4 shrink-0 items-center justify-center rounded-full border"
              :class="
                props.sort === option.key
                  ? 'border-sidebar-foreground'
                  : 'border-sidebar-muted-foreground/40'
              "
            >
              <span
                v-if="props.sort === option.key"
                class="size-2 rounded-full bg-sidebar-foreground"
              />
            </span>
            <p class="min-w-0 flex-1 truncate text-left text-[0.8125rem]/5">{{ option.name }}</p>
          </label>
        </div>
      </SidebarDisclosure>
    </div>

    <!-- Reserve the pinned promo card's height so its tail results stay reachable (see SidebarFooter). -->
    <div
      ref="scroller"
      class="min-h-0 flex-1 overflow-y-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      style="padding-bottom: calc(var(--sidebar-promo-height, 0px) + 1.5rem)"
    >
      <div v-if="!props.hasQuery" class="px-2 py-6 text-center">
        <p class="text-xs font-medium text-sidebar-muted-foreground">
          Type to filter every tab in the catalog.
        </p>
        <p class="mt-2 text-[11px] text-sidebar-muted-foreground/70">
          <kbd class="rounded bg-sidebar-raised px-1 py-0.5 font-medium">/</kbd>
          to focus ·
          <kbd class="rounded bg-sidebar-raised px-1 py-0.5 font-medium">Esc</kbd>
          to browse
        </p>
      </div>

      <div v-else-if="props.resultCount === 0" class="px-2 py-6 text-center">
        <p class="text-xs font-medium text-sidebar-muted-foreground">
          No tabs match "{{ props.query }}".
        </p>
      </div>

      <div v-else class="flex flex-col gap-px">
        <template v-for="group in props.resultGroups" :key="group.id">
          <h3
            class="flex h-7 items-center px-2 pt-2.5 pb-0.5 text-xs font-medium whitespace-nowrap text-sidebar-muted-foreground"
          >
            {{ group.parent }}
          </h3>

          <ul class="flex flex-col gap-px">
            <li v-for="result in group.results" :key="result.id">
              <SidebarNavRow
                :icon="result.icon"
                :label="result.name"
                :to="result.route"
                :count="result.count"
                :active="isActive(result.route)"
              />
            </li>
          </ul>
        </template>
      </div>
    </div>

    <SidebarScrollFades :scroller="scroller" />
  </div>
</template>
