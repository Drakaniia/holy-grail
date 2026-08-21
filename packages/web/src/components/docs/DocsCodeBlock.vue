<script setup lang="ts">
import { computed, onUnmounted, shallowRef } from 'vue'
import { Check, Copy } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    code: string
    label?: string
  }>(),
  {
    label: '',
  },
)

const copied = shallowRef(false)
let copyTimer: number | undefined

const normalizedCode = computed(() => props.code.trim())

async function copyCode() {
  if (!navigator.clipboard) return

  await navigator.clipboard.writeText(normalizedCode.value)
  copied.value = true

  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copied.value = false
  }, 1400)
}

onUnmounted(() => {
  window.clearTimeout(copyTimer)
})
</script>

<template>
  <figure class="docs-code-block">
    <figcaption v-if="label" class="docs-code-block__label">{{ label }}</figcaption>
    <div class="docs-code-block__body">
      <pre><code>{{ normalizedCode }}</code></pre>
      <button
        type="button"
        class="docs-code-block__copy"
        :aria-label="copied ? 'Copied code' : 'Copy code'"
        :title="copied ? 'Copied' : 'Copy code'"
        @click="copyCode"
      >
        <component :is="copied ? Check : Copy" class="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  </figure>
</template>

<style scoped>
.docs-code-block {
  margin: 1.2rem 0;
}

.docs-code-block__label {
  margin-bottom: 0.45rem;
  color: var(--docs-muted, #6f6b64);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.docs-code-block__body {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--docs-border, #e1dcd6);
  border-radius: 0.65rem;
  background: var(--docs-code-bg, #ffffff);
  box-shadow: 0 1rem 2.5rem rgba(24, 20, 16, 0.05);
}

.docs-code-block pre {
  margin: 0;
  overflow-x: auto;
  padding: 1rem 3.25rem 1rem 1.05rem;
  color: var(--docs-code-text, #24201b);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
  font-size: 0.82rem;
  line-height: 1.75;
  white-space: pre;
}

.docs-code-block__copy {
  position: absolute;
  top: 0.65rem;
  right: 0.65rem;
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 1px solid var(--docs-border, #ded8d0);
  border-radius: 0.45rem;
  background: var(--docs-surface-strong, #f8f5f0);
  color: var(--docs-muted, #5d5850);
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.docs-code-block__copy:hover {
  border-color: var(--docs-accent-strong, #ff9a32);
  background: var(--docs-warning-bg, #fff1e1);
  color: var(--docs-warning, #b65300);
}
</style>
