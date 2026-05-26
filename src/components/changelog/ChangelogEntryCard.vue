<script setup lang="ts">
interface ChangelogCommit {
  hash: string
  subject: string
  type: string
  typeLabel: string
}

interface ChangelogSection {
  date: string
  title: string
  highlights: string[]
  commits: ChangelogCommit[]
}

defineProps<{
  section: ChangelogSection
}>()
</script>

<template>
  <article class="changelog-entry">
    <header class="changelog-entry__header">
      <div>
        <p class="changelog-entry__date">{{ section.date }}</p>
        <h2>{{ section.title }}</h2>
      </div>
      <span>{{ section.commits.length }} commits</span>
    </header>

    <ul class="changelog-entry__highlights">
      <li v-for="highlight in section.highlights" :key="highlight">{{ highlight }}</li>
    </ul>

    <ol class="changelog-entry__commits" aria-label="Commits">
      <li v-for="commit in section.commits" :key="commit.hash">
        <code>{{ commit.hash }}</code>
        <span class="changelog-entry__subject">{{ commit.subject }}</span>
        <span class="changelog-entry__type" :class="`changelog-entry__type--${commit.type}`">
          {{ commit.typeLabel }}
        </span>
      </li>
    </ol>
  </article>
</template>

<style scoped>
.changelog-entry {
  position: relative;
  border: 1px solid var(--changelog-border);
  border-radius: 0.85rem;
  background: var(--changelog-surface);
  padding: 1.35rem;
  box-shadow: 0 1.5rem 3rem var(--changelog-shadow);
}

.changelog-entry::before {
  position: absolute;
  top: 1.55rem;
  left: -2.35rem;
  width: 0.75rem;
  height: 0.75rem;
  border: 2px solid var(--changelog-accent);
  border-radius: 999px;
  background: var(--changelog-bg);
  content: '';
}

.changelog-entry__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.changelog-entry__header h2 {
  margin: 0.2rem 0 0;
  color: var(--changelog-heading);
  font-size: 1.3rem;
  font-weight: 760;
  line-height: 1.25;
}

.changelog-entry__header > span {
  flex-shrink: 0;
  border: 1px solid var(--changelog-border);
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  color: var(--changelog-muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.changelog-entry__date {
  margin: 0;
  color: var(--changelog-accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.changelog-entry__highlights {
  display: grid;
  gap: 0.5rem;
  margin: 1rem 0 1.15rem;
  padding: 0;
  list-style: none;
}

.changelog-entry__highlights li {
  position: relative;
  padding-left: 1rem;
  color: var(--changelog-body);
  font-size: 0.94rem;
  line-height: 1.6;
}

.changelog-entry__highlights li::before {
  position: absolute;
  top: 0.67rem;
  left: 0;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--changelog-accent);
  content: '';
}

.changelog-entry__commits {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.changelog-entry__commits li {
  display: grid;
  grid-template-columns: 5.2rem minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  border-top: 1px solid var(--changelog-border);
  padding: 0.72rem 0;
}

.changelog-entry__commits code {
  border-radius: 0.3rem;
  background: var(--changelog-code-bg);
  padding: 0.16rem 0.35rem;
  color: var(--changelog-code-text);
  font-size: 0.76rem;
}

.changelog-entry__subject {
  min-width: 0;
  color: var(--changelog-body);
  font-size: 0.86rem;
  line-height: 1.45;
}

.changelog-entry__type {
  border: 1px solid var(--changelog-border);
  border-radius: 999px;
  padding: 0.18rem 0.45rem;
  color: var(--changelog-muted);
  font-size: 0.64rem;
  font-weight: 800;
  text-transform: uppercase;
}

.changelog-entry__type--feature {
  border-color: var(--changelog-feature-border);
  color: var(--changelog-feature);
}

.changelog-entry__type--fix {
  border-color: var(--changelog-fix-border);
  color: var(--changelog-fix);
}

.changelog-entry__type--deps,
.changelog-entry__type--merge {
  border-color: var(--changelog-deps-border);
  color: var(--changelog-deps);
}

@media (max-width: 760px) {
  .changelog-entry {
    padding: 1rem;
  }

  .changelog-entry::before {
    display: none;
  }

  .changelog-entry__header {
    flex-direction: column;
  }

  .changelog-entry__commits li {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.45rem;
  }

  .changelog-entry__type {
    width: fit-content;
  }
}
</style>
