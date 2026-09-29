<script setup lang="ts">
import { Minus } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

/**
 * Absolutely pinned above the footer strip (never in flow) so the browse list scrolls *underneath*
 * it. It needs an opaque surface for that to read as intentional rather than clipped.
 */
const emit = defineEmits<{
  dismiss: []
}>()
</script>

<template>
  <div
    class="flex select-none flex-col gap-3 rounded-lg border border-sidebar-border/70 bg-sidebar-raised p-3 text-[0.8125rem] shadow-[0_1px_4px_-2px_rgba(0,0,0,0.4)]"
  >
    <div class="flex items-start justify-between gap-2">
      <p class="font-medium text-sidebar-foreground">Missing something?</p>
      <button
        type="button"
        class="-mt-1 -mr-1 inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-muted-foreground transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60"
        aria-label="Dismiss submit announcement"
        @click="emit('dismiss')"
      >
        <Minus class="h-3.5 w-3.5" />
      </button>
    </div>

    <p class="leading-5 text-sidebar-muted-foreground">
      Know a site, extension or MCP server we haven't listed? Send it in — it ships straight to
      everyone's directory.
    </p>

    <div class="flex flex-col gap-2">
      <RouterLink
        to="/publish"
        class="inline-flex h-7 items-center justify-center rounded-md bg-accent-500 px-2.5 text-sm font-medium text-white transition-[background-color,transform] duration-150 hover:bg-accent-600 focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
      >
        Submit a resource
      </RouterLink>
      <RouterLink
        to="/changelog"
        class="text-xs text-sidebar-muted-foreground transition-colors hover:text-sidebar-foreground"
      >
        See what's new
      </RouterLink>
    </div>
  </div>
</template>
