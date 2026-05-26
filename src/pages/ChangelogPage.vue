<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, GitCommit, GitMerge, PackageCheck, Sparkles } from 'lucide-vue-next'
import Footer from '@/components/Footer.vue'
import ChangelogEntryCard from '@/components/changelog/ChangelogEntryCard.vue'
import { useTheme } from '@/composables/useTheme'
import changelogSource from '../../CHANGELOG.md?raw'

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

type ParseMode = 'none' | 'highlights' | 'commits'

const router = useRouter()
const { isLightMode } = useTheme()

function getCommitType(subject: string) {
  if (subject.startsWith('Merge pull request')) {
    return { type: 'merge', typeLabel: 'Merge' }
  }

  if (subject.startsWith('deps:')) {
    return { type: 'deps', typeLabel: 'Deps' }
  }

  if (subject.startsWith('feat')) {
    return { type: 'feature', typeLabel: 'Feature' }
  }

  if (subject.startsWith('fix')) {
    return { type: 'fix', typeLabel: 'Fix' }
  }

  if (subject.startsWith('docs')) {
    return { type: 'docs', typeLabel: 'Docs' }
  }

  if (subject.startsWith('ci')) {
    return { type: 'ci', typeLabel: 'CI' }
  }

  if (subject.startsWith('chore')) {
    return { type: 'chore', typeLabel: 'Chore' }
  }

  if (subject.startsWith('refactor')) {
    return { type: 'refactor', typeLabel: 'Refactor' }
  }

  if (subject.startsWith('style')) {
    return { type: 'style', typeLabel: 'Style' }
  }

  return { type: 'change', typeLabel: 'Change' }
}

function parseChangelog(source: string) {
  const sections: ChangelogSection[] = []
  let currentSection: ChangelogSection | null = null
  let mode: ParseMode = 'none'

  source.split(/\r?\n/).forEach((line) => {
    const heading = /^## (\d{4}-\d{2}-\d{2}) - (.+)$/.exec(line)

    if (heading) {
      currentSection = {
        date: heading[1] ?? '',
        title: heading[2] ?? '',
        highlights: [],
        commits: [],
      }
      sections.push(currentSection)
      mode = 'none'
      return
    }

    if (line === '### Highlights') {
      mode = 'highlights'
      return
    }

    if (line === '### Commits') {
      mode = 'commits'
      return
    }

    if (!currentSection || !line.startsWith('- ')) return

    if (mode === 'highlights') {
      currentSection.highlights.push(line.slice(2))
      return
    }

    if (mode === 'commits') {
      const commit = /^- `([^`]+)` (.+)$/.exec(line)
      if (!commit) return

      const subject = commit[2] ?? ''
      currentSection.commits.push({
        hash: commit[1] ?? '',
        subject,
        ...getCommitType(subject),
      })
    }
  })

  return sections
}

const changelogSections = parseChangelog(changelogSource)
const latestSection = computed(() => changelogSections[0])
const totalCommits = computed(() =>
  changelogSections.reduce((total, section) => total + section.commits.length, 0),
)
const mergeCommits = computed(() =>
  changelogSections.reduce(
    (total, section) => total + section.commits.filter(commit => commit.type === 'merge').length,
    0,
  ),
)
const dependencyCommits = computed(() =>
  changelogSections.reduce(
    (total, section) => total + section.commits.filter(commit => commit.type === 'deps').length,
    0,
  ),
)

const heroStats = computed(() => [
  { label: 'Commits read', value: totalCommits.value, icon: GitCommit },
  { label: 'Merge commits', value: mergeCommits.value, icon: GitMerge },
  { label: 'Dependency updates', value: dependencyCommits.value, icon: PackageCheck },
])

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void router.push('/')
}
</script>

<template>
  <div class="changelog-page" :class="{ 'changelog-page--light': isLightMode }">
    <div class="changelog-backbar">
      <button type="button" class="changelog-backbar__button" @click="goBack">
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        <span>Back</span>
      </button>
    </div>

    <main class="changelog-shell">
      <header class="changelog-hero">
        <div class="changelog-badge">
          <span aria-hidden="true"></span>
          Version history
        </div>
        <h1>Changelog<span>.</span></h1>
        <p>
          Every entry below is generated from the local Git history, grouped by date and
          expanded into highlights plus the full commit index.
        </p>

        <dl class="changelog-stats">
          <div v-for="stat in heroStats" :key="stat.label">
            <component :is="stat.icon" class="h-4 w-4" aria-hidden="true" />
            <dt>{{ stat.label }}</dt>
            <dd>{{ stat.value }}</dd>
          </div>
        </dl>
      </header>

      <section v-if="latestSection" class="changelog-feature">
        <div class="changelog-feature__labels">
          <span>Latest</span>
          <span>{{ latestSection.date }}</span>
        </div>
        <h2>{{ latestSection.title }}</h2>
        <p>{{ latestSection.highlights[0] }}</p>
        <div class="changelog-feature__links">
          <RouterLink to="/docs">Read docs</RouterLink>
          <RouterLink to="/publish">Open publish flow</RouterLink>
          <a href="https://github.com/Drakaniia/holy-grail" target="_blank" rel="noreferrer">
            GitHub repository
          </a>
        </div>
      </section>

      <section class="changelog-timeline" aria-label="Full changelog timeline">
        <div class="changelog-timeline__rail" aria-hidden="true"></div>
        <ChangelogEntryCard
          v-for="section in changelogSections"
          :key="section.date"
          :section="section"
        />
      </section>

      <footer class="changelog-source">
        <Sparkles class="h-4 w-4" aria-hidden="true" />
        <p>
          Source of truth: <code>CHANGELOG.md</code>, generated from every commit reachable
          from the current branch.
        </p>
      </footer>
    </main>

    <Footer />
  </div>
</template>

<style scoped>
.changelog-page {
  --changelog-bg: #050505;
  --changelog-bg-glass: rgba(5, 5, 5, 0.92);
  --changelog-surface: #10100f;
  --changelog-surface-strong: #171512;
  --changelog-border: #2d2925;
  --changelog-heading: #ffffff;
  --changelog-text: #f7f2ec;
  --changelog-body: #c9c0b7;
  --changelog-muted: #91877c;
  --changelog-code-bg: #1a1714;
  --changelog-code-text: #f5eee6;
  --changelog-accent: #ff8a1f;
  --changelog-accent-soft: rgba(255, 138, 31, 0.13);
  --changelog-shadow: rgba(0, 0, 0, 0.22);
  --changelog-feature: #f2bb63;
  --changelog-feature-border: rgba(242, 187, 99, 0.55);
  --changelog-fix: #7bd69e;
  --changelog-fix-border: rgba(123, 214, 158, 0.5);
  --changelog-deps: #8eb6ff;
  --changelog-deps-border: rgba(142, 182, 255, 0.5);
  color-scheme: dark;
  min-height: 100%;
  background: var(--changelog-bg);
  color: var(--changelog-text);
}

.changelog-page--light {
  --changelog-bg: #f8f6f2;
  --changelog-bg-glass: rgba(248, 246, 242, 0.92);
  --changelog-surface: #ffffff;
  --changelog-surface-strong: #f1eee9;
  --changelog-border: #e4ded7;
  --changelog-heading: #000000;
  --changelog-text: #111111;
  --changelog-body: #504a43;
  --changelog-muted: #6f6b64;
  --changelog-code-bg: #efebe5;
  --changelog-code-text: #24201b;
  --changelog-accent: #ff7a00;
  --changelog-accent-soft: #fff4e8;
  --changelog-shadow: rgba(24, 20, 16, 0.06);
  --changelog-feature: #b65300;
  --changelog-feature-border: #f0cda8;
  --changelog-fix: #177245;
  --changelog-fix-border: #cce4ce;
  --changelog-deps: #315fba;
  --changelog-deps-border: #cedaf5;
  color-scheme: light;
}

.changelog-backbar {
  border-bottom: 1px solid var(--changelog-border);
  background: var(--changelog-bg-glass);
  backdrop-filter: blur(16px);
}

.changelog-backbar__button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 3.2rem;
  padding: 0 1.5rem;
  color: var(--changelog-text);
  font-size: 0.88rem;
  font-weight: 600;
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.changelog-backbar__button:hover {
  color: var(--changelog-accent);
  transform: translateX(-0.15rem);
}

.changelog-shell {
  width: min(100%, 49rem);
  margin: 0 auto;
  padding: 4rem 1.5rem 5rem;
}

.changelog-hero {
  max-width: 43rem;
  padding-bottom: 3.8rem;
}

.changelog-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.6rem;
  border: 1px solid var(--changelog-border);
  border-radius: 999px;
  background: var(--changelog-surface);
  padding: 0 0.8rem;
  color: var(--changelog-muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.changelog-badge span {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--changelog-accent);
}

.changelog-hero h1 {
  margin: 1.1rem 0 1rem;
  color: var(--changelog-heading);
  font-size: 4.5rem;
  font-weight: 720;
  letter-spacing: 0;
  line-height: 0.98;
}

.changelog-hero h1 span {
  color: var(--changelog-muted);
}

.changelog-hero p {
  margin: 0;
  color: var(--changelog-body);
  font-size: 1rem;
  line-height: 1.75;
}

.changelog-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 2rem 0 0;
}

.changelog-stats div {
  border: 1px solid var(--changelog-border);
  border-radius: 0.75rem;
  background: var(--changelog-surface);
  padding: 0.9rem;
}

.changelog-stats svg {
  color: var(--changelog-accent);
}

.changelog-stats dt {
  margin-top: 0.55rem;
  color: var(--changelog-muted);
  font-size: 0.72rem;
  font-weight: 700;
}

.changelog-stats dd {
  margin: 0.15rem 0 0;
  color: var(--changelog-heading);
  font-size: 1.35rem;
  font-weight: 800;
}

.changelog-feature {
  border: 1px solid var(--changelog-accent);
  border-radius: 0.85rem;
  background:
    linear-gradient(135deg, var(--changelog-accent-soft), transparent 75%),
    var(--changelog-surface);
  padding: 1.45rem;
}

.changelog-feature__labels {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.85rem;
}

.changelog-feature__labels span {
  border: 1px solid var(--changelog-border);
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  color: var(--changelog-muted);
  font-size: 0.66rem;
  font-weight: 800;
  text-transform: uppercase;
}

.changelog-feature h2 {
  margin: 0;
  color: var(--changelog-heading);
  font-size: 1.35rem;
  font-weight: 760;
}

.changelog-feature p {
  margin: 0.65rem 0 0;
  color: var(--changelog-body);
  font-size: 0.94rem;
  line-height: 1.7;
}

.changelog-feature__links {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin-top: 1rem;
}

.changelog-feature__links a {
  display: inline-flex;
  align-items: center;
  min-height: 2.35rem;
  border: 1px solid var(--changelog-border);
  border-radius: 0.6rem;
  background: var(--changelog-surface);
  padding: 0 0.8rem;
  color: var(--changelog-heading);
  font-size: 0.8rem;
  font-weight: 700;
  transition:
    border-color 160ms ease,
    color 160ms ease;
}

.changelog-feature__links a:hover {
  border-color: var(--changelog-accent);
  color: var(--changelog-accent);
}

.changelog-timeline {
  position: relative;
  display: grid;
  gap: 1.2rem;
  margin-top: 3rem;
  padding-left: 2rem;
}

.changelog-timeline__rail {
  position: absolute;
  top: 0.5rem;
  bottom: 0;
  left: 0;
  width: 1px;
  background: var(--changelog-border);
}

.changelog-source {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: 2.5rem;
  border-top: 1px solid var(--changelog-border);
  padding-top: 1.25rem;
  color: var(--changelog-body);
}

.changelog-source svg {
  flex-shrink: 0;
  color: var(--changelog-accent);
}

.changelog-source p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
}

.changelog-source code {
  border-radius: 0.3rem;
  background: var(--changelog-code-bg);
  padding: 0.12rem 0.32rem;
  color: var(--changelog-code-text);
}

@media (max-width: 760px) {
  .changelog-shell {
    padding: 2.2rem 1rem 4rem;
  }

  .changelog-hero {
    padding-bottom: 2rem;
  }

  .changelog-hero h1 {
    font-size: 3.2rem;
  }

  .changelog-stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .changelog-timeline {
    padding-left: 0;
  }

  .changelog-timeline__rail {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .changelog-backbar__button,
  .changelog-feature__links a {
    transition: none;
  }

  .changelog-backbar__button:hover {
    transform: none;
  }
}
</style>
