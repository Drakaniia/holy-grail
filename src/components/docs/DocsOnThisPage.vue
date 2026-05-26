<script setup lang="ts">
interface DocsSectionLink {
  id: string
  label: string
}

defineProps<{
  sections: DocsSectionLink[]
  activeId: string
}>()
</script>

<template>
  <nav class="docs-on-this-page" aria-label="On this page">
    <p class="docs-on-this-page__eyebrow">On this page</p>
    <ol class="docs-on-this-page__list">
      <li v-for="section in sections" :key="section.id">
        <a
          :href="`#${section.id}`"
          class="docs-on-this-page__link"
          :class="{ 'docs-on-this-page__link--active': activeId === section.id }"
          :aria-current="activeId === section.id ? 'location' : undefined"
        >
          {{ section.label }}
        </a>
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.docs-on-this-page {
  position: sticky;
  top: 1.5rem;
  align-self: start;
  color: var(--docs-text, #111111);
}

.docs-on-this-page__eyebrow {
  margin: 0 0 0.7rem;
  color: var(--docs-muted, #6f6b64);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.docs-on-this-page__list {
  display: grid;
  gap: 0.15rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.docs-on-this-page__link {
  display: block;
  border-left: 2px solid transparent;
  padding: 0.42rem 0 0.42rem 0.85rem;
  color: var(--docs-body, #25211c);
  font-size: 0.9rem;
  line-height: 1.25;
  transition:
    border-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.docs-on-this-page__link:hover {
  color: var(--docs-accent-strong, #d46600);
}

.docs-on-this-page__link--active {
  border-left-color: var(--docs-accent, #ff7a00);
  color: var(--docs-heading, #000000);
  transform: translateX(0.15rem);
}

@media (max-width: 980px) {
  .docs-on-this-page {
    position: static;
    overflow-x: auto;
    border-bottom: 1px solid var(--docs-border, #e6e1dc);
    padding-bottom: 1rem;
  }

  .docs-on-this-page__list {
    display: flex;
    gap: 0.45rem;
    min-width: max-content;
  }

  .docs-on-this-page__link {
    border: 1px solid var(--docs-border, #ded8d0);
    border-radius: 999px;
    padding: 0.45rem 0.7rem;
    background: var(--docs-surface, #ffffff);
    font-size: 0.78rem;
  }

  .docs-on-this-page__link--active {
    border-color: var(--docs-accent, #ff7a00);
    transform: none;
  }
}
</style>
