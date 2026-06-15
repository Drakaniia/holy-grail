<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CheckCircle2, Clock3, FileCode2, ShieldCheck, Sparkles } from 'lucide-vue-next'
import Footer from '@/components/Footer.vue'
import DocsCodeBlock from '@/components/docs/DocsCodeBlock.vue'
import DocsOnThisPage from '@/components/docs/DocsOnThisPage.vue'
import { useTheme } from '@/composables/useTheme'

const router = useRouter()
const { isLightMode } = useTheme()

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'local-setup', label: 'Local setup' },
  { id: 'routes-shell', label: 'Routes and shell' },
  { id: 'sites-catalog', label: 'Sites catalog' },
  { id: 'skills-catalog', label: 'Skills catalog' },
  { id: 'publish-flow', label: 'Publish flow' },
  { id: 'admin-review', label: 'Admin review' },
  { id: 'previews', label: 'Previews' },
  { id: 'supabase', label: 'Supabase' },
  { id: 'validation', label: 'Validation' },
  { id: 'troubleshooting', label: 'Troubleshooting' },
]

const overviewCards = [
  {
    title: 'Static catalog core',
    description:
      'Published resources live as checked-in YAML under src/content and are regenerated into JSON indexes before Vite serves or builds the app.',
    icon: FileCode2,
  },
  {
    title: 'Moderated intake',
    description:
      'The publish page collects structured submissions, stores them as pending Supabase rows, and leaves final catalog changes to an admin review pass.',
    icon: ShieldCheck,
  },
  {
    title: 'Runtime convenience',
    description:
      'Pinia stores fetch generated indexes from /content, while skill detail pages fetch remote SKILL.md files and cache them in localStorage for 24 hours.',
    icon: Sparkles,
  },
]

const routeRows = [
  {
    route: '/',
    owner: 'Standalone home',
    notes: 'Landing directory, preview strip, and high-level navigation.',
  },
  {
    route: '/sites/:category/:subcategory?',
    owner: 'SitesPage',
    notes: 'Category and subcategory catalog browsing.',
  },
  {
    route: '/sites/:slug',
    owner: 'SiteDetail',
    notes: 'Resource detail, preview, links, features, and issue reporting.',
  },
  { route: '/skills/:category', owner: 'SkillsPage', notes: 'Skill category browser.' },
  {
    route: '/skills/:slug',
    owner: 'SkillDetail',
    notes: 'Skill metadata plus remote SKILL.md content.',
  },
  {
    route: '/publish',
    owner: 'SubmitPage',
    notes: 'Public intake flow. /submit remains a compatibility alias.',
  },
  { route: '/admin', owner: 'AdminPage', notes: 'Authenticated admin review console.' },
  {
    route: '/docs',
    owner: 'DocumentationPage',
    notes: 'Standalone documentation surface without the app shell.',
  },
  {
    route: '/changelog',
    owner: 'ChangelogPage',
    notes: 'Version history generated from the full commit log.',
  },
]

const artifactRows = [
  {
    file: 'src/content/sites-index.json',
    purpose: 'Generated sites catalog consumed by the sites store.',
  },
  { file: 'public/content/sites-index.json', purpose: 'Runtime copy fetched by the browser.' },
  {
    file: 'src/content/skills-index.json',
    purpose: 'Generated skills catalog consumed by the skills store.',
  },
  { file: 'public/content/skills-index.json', purpose: 'Runtime copy fetched by the browser.' },
  {
    file: 'public/previews/manifest.json',
    purpose: 'Static preview manifest written by the preview generator.',
  },
  { file: 'src/content/site-previews.json', purpose: 'Preview lookup imported by the app.' },
]

const publishSteps = [
  'Choose whether the submission is a site, tool, skill, or library.',
  'Enter the source URL and validate that it is usable.',
  'Generate or fill structured metadata such as name, category, tags, description, and features.',
  'Review the editable summary before sending.',
  'Submit to Supabase as a pending row and show a success state to the contributor.',
  'Admin approves or rejects the row in /admin.',
  'Approved resources are still added to YAML and published through the normal build.',
]

const statusRows = [
  { status: 'Draft', meaning: 'Contributor is still editing the form.' },
  { status: 'Ready to submit', meaning: 'Required fields pass client-side validation.' },
  { status: 'Pending review', meaning: 'Supabase stored the submission and notified the admin.' },
  { status: 'Approved', meaning: 'Admin accepted the submission as worth adding.' },
  { status: 'Rejected', meaning: 'Admin closed the submission with a reason or note.' },
  {
    status: 'Published',
    meaning:
      'A checked-in YAML entry exists, generated assets are updated, and the app has been built/deployed.',
  },
]

const validationRows = [
  { command: 'bun run type-check', purpose: 'Runs vue-tsc with strict TypeScript settings.' },
  { command: 'bun lint', purpose: 'Runs oxlint first, then ESLint with fixes/cache.' },
  {
    command: 'bun run build',
    purpose: 'Regenerates indexes, type-checks, and builds the Vite app.',
  },
]

const troubleshootingRows = [
  {
    symptom: 'A new resource is missing from the UI.',
    fix: 'Confirm meta.yaml exists, regenerate the correct index, and check that the generated JSON changed.',
  },
  {
    symptom: 'A site preview is blank.',
    fix: 'Run the preview generator for that slug and commit the .webp, thumbnail, manifest, and site-previews.json changes.',
  },
  {
    symptom: 'A submitted tool is not public yet.',
    fix: 'That is expected. Submissions wait for admin review, then a YAML entry and normal deployment.',
  },
  {
    symptom: 'Skill detail content does not refresh.',
    fix: 'Remote SKILL.md content is cached in localStorage for 24 hours; clear the cache or wait for the TTL.',
  },
  {
    symptom: 'A form shows “Failed to send a request to the Edge Function.”',
    fix: 'Confirm the called function is deployed to the Supabase project in VITE_SUPABASE_URL, then check that the current browser origin is listed in the matching allowed-origins secret.',
  },
]

const setupCommands = `
bun install
bun dev
`

const validationCommands = `
bun run type-check
bun lint
bun run build
`

const siteYamlExample = `
name: Example Tool
slug: example-tool
url: https://example.com
parentCategory: development
subcategory: tooling
description: Short practical description for catalog cards.
tags:
  - devtools
  - workflow
featured: false
verified: true
`

const siteImportCommands = `
bun run import:bookmarks
bun run scripts/enrich-site-metadata.js --apply
bun run scripts/fill-site-detail-sections.js --apply
bun run scripts/generate-sites-index.js
`

const skillYamlExample = `
name: Example Skill
slug: example-skill
repository: owner/repository
skillPath: skills/example-skill/SKILL.md
parentCategory: skills
subcategory: development
description: Reusable operating instructions for a focused workflow.
tags:
  - workflow
  - agents
`

const previewCommands = `
bun run scripts/generate-site-previews.js --slug <slug>
bun run generate:previews
bun run generate:previews:all
bun run review:previews
`

const supabaseCommands = `
supabase db push
supabase functions deploy submit-tool --no-verify-jwt
supabase functions deploy report-site-issue --no-verify-jwt
supabase functions deploy delete-account --no-verify-jwt
`

const supabaseSecretCommands = `
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set ADMIN_EMAIL=you@example.com
supabase secrets set SUBMISSION_FROM_EMAIL="Holy Grail <submissions@your-domain.com>"
supabase secrets set PUBLIC_SITE_URL=https://holy-grail-eta.vercel.app
supabase secrets set SUBMISSION_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app
supabase secrets set ACCOUNT_ALLOWED_ORIGINS=https://holy-grail-eta.vercel.app
supabase secrets set SUBMISSION_RATE_LIMIT_MAX=5
supabase secrets set SUBMISSION_RATE_LIMIT_WINDOW_SECONDS=3600
supabase secrets set SUBMISSION_RATE_LIMIT_SALT=use-a-long-random-string
`

const activeSectionId = shallowRef(sections[0]?.id ?? '')
let observer: IntersectionObserver | null = null

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void router.push('/')
}

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => first.boundingClientRect.top - second.boundingClientRect.top)[0]

      if (activeEntry?.target.id) {
        activeSectionId.value = activeEntry.target.id
      }
    },
    {
      rootMargin: '-22% 0px -62% 0px',
      threshold: [0, 0.4, 1],
    },
  )

  sections.forEach((section) => {
    const target = document.getElementById(section.id)
    if (target) {
      observer?.observe(target)
    }
  })
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="docs-page" :class="{ 'docs-page--light': isLightMode }">
    <div class="docs-backbar">
      <button type="button" class="docs-backbar__button" @click="goBack">
        <ArrowLeft class="h-4 w-4" aria-hidden="true" />
        <span>Back</span>
      </button>
    </div>

    <div class="docs-layout">
      <DocsOnThisPage :sections="sections" :active-id="activeSectionId" />

      <article class="docs-article">
        <header class="docs-hero">
          <div class="docs-badge">
            <span aria-hidden="true"></span>
            Documentation
          </div>
          <h1>Getting <em>started.</em></h1>
          <p>
            Operate Holy Grail as a curated catalog: add resources, regenerate indexes, review
            submissions, create previews, and ship changes through the normal validation path.
          </p>
        </header>

        <section id="overview" class="docs-section">
          <h2>Overview</h2>
          <p>
            Holy Grail is not a database-first directory. The public catalog is a static, versioned
            content system, while Supabase handles intake, review state, and admin notifications.
          </p>

          <div class="docs-card-grid">
            <article v-for="card in overviewCards" :key="card.title" class="docs-card">
              <component :is="card.icon" class="docs-card__icon" aria-hidden="true" />
              <h3>{{ card.title }}</h3>
              <p>{{ card.description }}</p>
            </article>
          </div>
        </section>

        <section id="local-setup" class="docs-section">
          <h2>Local setup</h2>
          <p>
            Use Bun for every package and script command. The development server and production
            build both regenerate catalog indexes before Vite starts.
          </p>
          <DocsCodeBlock label="Start the app" :code="setupCommands" />
          <p>
            The default local target is <code>http://localhost:5173</code>. If the port is already
            in use, Vite will choose the next available port and print it in the terminal.
          </p>
        </section>

        <section id="routes-shell" class="docs-section">
          <h2>Routes and shell</h2>
          <p>
            The home and auth pages are standalone. Catalog, publishing, admin, account, and
            documentation pages use the shared app shell with sidebar, top navigation, command
            palette, and footer.
          </p>

          <div class="docs-table" role="table" aria-label="Holy Grail route map">
            <div class="docs-table__row docs-table__row--head" role="row">
              <span role="columnheader">Route</span>
              <span role="columnheader">Surface</span>
              <span role="columnheader">Notes</span>
            </div>
            <div v-for="row in routeRows" :key="row.route" class="docs-table__row" role="row">
              <code role="cell">{{ row.route }}</code>
              <span role="cell">{{ row.owner }}</span>
              <span role="cell">{{ row.notes }}</span>
            </div>
          </div>
        </section>

        <section id="sites-catalog" class="docs-section">
          <h2>Sites catalog</h2>
          <p>
            Sites are authored as directories under <code>src/content/sites/</code>. Each resource
            owns a <code>meta.yaml</code> file with its category, URL, description, tags, feature
            details, and related tools.
          </p>
          <DocsCodeBlock label="Minimal site metadata" :code="siteYamlExample" />
          <p>
            Manual additions should use stable slugs, meaningful categories, and complete detail
            sections. Bookmark imports can bootstrap many resources, but the generated metadata
            still needs a review pass before publishing.
          </p>
          <DocsCodeBlock label="Bookmark import pipeline" :code="siteImportCommands" />

          <div class="docs-note">
            <CheckCircle2 class="h-4 w-4" aria-hidden="true" />
            <p>
              After adding or changing site metadata, regenerate the sites index or run
              <code>bun dev</code> / <code>bun run build</code>, which do it automatically.
            </p>
          </div>
        </section>

        <section id="skills-catalog" class="docs-section">
          <h2>Skills catalog</h2>
          <p>
            Skills are cataloged from <code>src/content/skills/&lt;slug&gt;/meta.yaml</code>. The
            local metadata powers browsing, while the actual <code>SKILL.md</code>
            content is fetched from the linked GitHub repository at runtime.
          </p>
          <DocsCodeBlock label="Minimal skill metadata" :code="skillYamlExample" />
          <p>
            Skill content is cached in localStorage for 24 hours to keep detail pages fast without
            bundling remote markdown into the app.
          </p>
          <DocsCodeBlock label="Regenerate skills" code="bun run generate:skills" />
        </section>

        <section id="publish-flow" class="docs-section">
          <h2>Publish flow</h2>
          <p>
            Publishing is a moderated workflow. A contributor can submit a resource, but that does
            not automatically make it public in the catalog.
          </p>

          <ol class="docs-process-list">
            <li v-for="(step, index) in publishSteps" :key="step">
              <span>{{ String(index + 1).padStart(2, '0') }}</span>
              <p>{{ step }}</p>
            </li>
          </ol>

          <div class="docs-table docs-table--status" role="table" aria-label="Publish statuses">
            <div class="docs-table__row docs-table__row--head" role="row">
              <span role="columnheader">Status</span>
              <span role="columnheader">Meaning</span>
            </div>
            <div v-for="row in statusRows" :key="row.status" class="docs-table__row" role="row">
              <strong role="cell">{{ row.status }}</strong>
              <span role="cell">{{ row.meaning }}</span>
            </div>
          </div>
        </section>

        <section id="admin-review" class="docs-section">
          <h2>Admin review</h2>
          <p>
            Admin access comes from server-controlled Supabase <code>app_metadata</code>, not
            user-editable profile metadata. The admin page lists pending submissions, supports
            approval or rejection, and keeps notes with the reviewed row.
          </p>
          <div class="docs-note docs-note--warning">
            <ShieldCheck class="h-4 w-4" aria-hidden="true" />
            <p>
              Approval means the item is accepted for catalog work. The final public listing still
              requires a YAML entry, generated assets, validation, and deployment.
            </p>
          </div>
        </section>

        <section id="previews" class="docs-section">
          <h2>Previews</h2>
          <p>
            Site previews are static assets. They are not fetched live at runtime, so every new site
            needs preview generation before it can look complete in the UI.
          </p>
          <DocsCodeBlock label="Preview commands" :code="previewCommands" />

          <div
            class="docs-table docs-table--artifacts"
            role="table"
            aria-label="Generated artifacts"
          >
            <div class="docs-table__row docs-table__row--head" role="row">
              <span role="columnheader">Artifact</span>
              <span role="columnheader">Purpose</span>
            </div>
            <div v-for="row in artifactRows" :key="row.file" class="docs-table__row" role="row">
              <code role="cell">{{ row.file }}</code>
              <span role="cell">{{ row.purpose }}</span>
            </div>
          </div>

          <p>
            If a live site blocks Puppeteer, the generator writes a fallback preview so the catalog
            entry is never blank.
          </p>
          <p>
            Run the preview review when images look broken, stale, or like generated fallback
            artwork instead of real site screenshots.
          </p>
        </section>

        <section id="supabase" class="docs-section">
          <h2>Supabase</h2>
          <p>
            Supabase stores the submission inbox, site issue inbox, review status, rate-limit
            helpers, and submission notification workflow. The published catalog remains checked
            into the repo.
          </p>
          <DocsCodeBlock label="Database and functions" :code="supabaseCommands" />
          <DocsCodeBlock label="Submission secrets" :code="supabaseSecretCommands" />
          <p>
            The <code>submit-tool</code> function validates the request origin, applies a
            server-side rate limit, inserts the pending row with service credentials, and emails the
            admin after the row is saved. The <code>report-site-issue</code> function uses the same
            protected path to create broken, legacy, wrong-URL, and other issue rows for the admin
            dashboard. The <code>delete-account</code> function performs signed-in account deletion
            with server-side confirmation.
          </p>
        </section>

        <section id="validation" class="docs-section">
          <h2>Validation</h2>
          <p>Use the same sequence as CI before treating a content or UI change as complete.</p>
          <DocsCodeBlock label="Verification sequence" :code="validationCommands" />

          <div class="docs-table docs-table--status" role="table" aria-label="Validation commands">
            <div class="docs-table__row docs-table__row--head" role="row">
              <span role="columnheader">Command</span>
              <span role="columnheader">Purpose</span>
            </div>
            <div
              v-for="row in validationRows"
              :key="row.command"
              class="docs-table__row"
              role="row"
            >
              <code role="cell">{{ row.command }}</code>
              <span role="cell">{{ row.purpose }}</span>
            </div>
          </div>
        </section>

        <section id="troubleshooting" class="docs-section">
          <h2>Troubleshooting</h2>
          <div class="docs-troubleshooting">
            <article v-for="row in troubleshootingRows" :key="row.symptom">
              <h3>{{ row.symptom }}</h3>
              <p>{{ row.fix }}</p>
            </article>
          </div>
        </section>

        <footer class="docs-finish">
          <Clock3 class="h-4 w-4" aria-hidden="true" />
          <p>
            The shortest safe path for a new public listing is metadata, preview, generated index,
            type-check, lint, build, then deploy.
          </p>
          <RouterLink to="/publish">Open publish flow</RouterLink>
        </footer>
      </article>
    </div>

    <Footer />
  </div>
</template>

<style scoped>
.docs-page {
  --docs-bg: #1f1f1f;
  --docs-bg-glass: rgba(31, 31, 31, 0.92);
  --docs-surface: #1f1f1f;
  --docs-surface-strong: #1f1f1f;
  --docs-surface-soft: #1f1f1f;
  --docs-border: #2d2925;
  --docs-border-strong: #3a342e;
  --docs-heading: #ffffff;
  --docs-text: #f7f2ec;
  --docs-body: #c9c0b7;
  --docs-muted: #91877c;
  --docs-code-bg: #1f1f1f;
  --docs-code-text: #f5eee6;
  --docs-accent: #ff8a1f;
  --docs-accent-strong: #ff9b3d;
  --docs-success-border: #2e6348;
  --docs-success-bg: rgba(35, 106, 72, 0.18);
  --docs-success: #7bd69e;
  --docs-warning-border: #7a4b21;
  --docs-warning-bg: rgba(255, 138, 31, 0.14);
  --docs-warning: #ffb15a;
  color-scheme: dark;
  min-height: 100%;
  background: var(--docs-bg);
  color: var(--docs-text);
}

.docs-page--light {
  --docs-bg: #f8f6f2;
  --docs-bg-glass: rgba(248, 246, 242, 0.92);
  --docs-surface: #ffffff;
  --docs-surface-strong: #f1eee9;
  --docs-surface-soft: #efebe5;
  --docs-border: #e4ded7;
  --docs-border-strong: #d7d0c8;
  --docs-heading: #1f1f1f;
  --docs-text: #1f1f1f;
  --docs-body: #504a43;
  --docs-muted: #6f6b64;
  --docs-code-bg: #ffffff;
  --docs-code-text: #24201b;
  --docs-accent: #ff7a00;
  --docs-accent-strong: #d46600;
  --docs-success-border: #d7e7d5;
  --docs-success-bg: #f3fbf1;
  --docs-success: #177245;
  --docs-warning-border: #f0d5b7;
  --docs-warning-bg: #fff4e8;
  --docs-warning: #b65300;
  color-scheme: light;
}

.docs-backbar {
  border-bottom: 1px solid var(--docs-border);
  background: var(--docs-bg-glass);
  backdrop-filter: blur(16px);
}

.docs-backbar__button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  min-height: 3.2rem;
  padding: 0 1.5rem;
  color: var(--docs-text);
  font-size: 0.88rem;
  font-weight: 600;
  transition:
    color 160ms ease,
    transform 160ms ease;
}

.docs-backbar__button:hover {
  color: var(--docs-accent-strong);
  transform: translateX(-0.15rem);
}

.docs-layout {
  display: grid;
  grid-template-columns: minmax(10rem, 12rem) minmax(0, 49rem);
  gap: clamp(2rem, 6vw, 5.5rem);
  width: min(100%, 76rem);
  margin: 0 auto;
  padding: 4.1rem 1.5rem 6rem;
}

.docs-article {
  min-width: 0;
}

.docs-hero {
  max-width: 45rem;
  padding-bottom: 3.8rem;
}

.docs-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 1.6rem;
  border: 1px solid var(--docs-border);
  border-radius: 999px;
  background: var(--docs-surface);
  padding: 0 0.8rem;
  color: var(--docs-muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.docs-badge span {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: var(--docs-accent);
}

.docs-hero h1 {
  margin: 1.15rem 0 1rem;
  color: var(--docs-heading);
  font-size: 4.7rem;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 0.96;
}

.docs-hero em {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 0.9em;
  font-weight: 400;
}

.docs-hero p,
.docs-section > p,
.docs-note p,
.docs-finish p {
  color: var(--docs-body);
  font-size: 1rem;
  line-height: 1.75;
}

.docs-section {
  scroll-margin-top: 2rem;
  padding: 2.4rem 0;
  border-top: 1px solid var(--docs-border);
}

.docs-section h2 {
  margin: 0 0 1.45rem;
  color: var(--docs-heading);
  font-size: 1.55rem;
  font-weight: 750;
  letter-spacing: 0;
  line-height: 1.2;
}

.docs-section h3 {
  margin: 0;
  color: var(--docs-heading);
  font-size: 0.98rem;
  font-weight: 750;
  line-height: 1.35;
}

.docs-section code,
.docs-finish code {
  border-radius: 0.3rem;
  background: var(--docs-surface-soft);
  padding: 0.12rem 0.32rem;
  color: var(--docs-code-text);
  font-size: 0.88em;
}

.docs-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.8rem;
  margin-top: 1.4rem;
}

.docs-card,
.docs-troubleshooting article {
  border: 1px solid var(--docs-border);
  border-radius: 0.7rem;
  background: var(--docs-surface);
  padding: 1rem;
  box-shadow: 0 1rem 2rem rgba(24, 20, 16, 0.04);
}

.docs-card__icon {
  width: 1.15rem;
  height: 1.15rem;
  margin-bottom: 0.75rem;
  color: var(--docs-accent-strong);
}

.docs-card p,
.docs-troubleshooting p {
  margin: 0.55rem 0 0;
  color: var(--docs-muted);
  font-size: 0.88rem;
  line-height: 1.6;
}

.docs-note {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
  border: 1px solid var(--docs-success-border);
  border-radius: 0.7rem;
  background: var(--docs-success-bg);
  padding: 0.95rem 1rem;
  color: var(--docs-success);
}

.docs-note--warning {
  border-color: var(--docs-warning-border);
  background: var(--docs-warning-bg);
  color: var(--docs-warning);
}

.docs-note svg {
  margin-top: 0.35rem;
  flex-shrink: 0;
}

.docs-note p {
  margin: 0;
}

.docs-table {
  overflow: hidden;
  margin: 1.4rem 0;
  border: 1px solid var(--docs-border);
  border-radius: 0.7rem;
  background: var(--docs-surface);
}

.docs-table__row {
  display: grid;
  grid-template-columns: minmax(8rem, 0.9fr) minmax(7rem, 0.8fr) minmax(0, 1.4fr);
  gap: 1rem;
  padding: 0.95rem 1rem;
  border-top: 1px solid var(--docs-border);
  color: var(--docs-body);
  font-size: 0.86rem;
  line-height: 1.5;
}

.docs-table__row:first-child {
  border-top: 0;
}

.docs-table__row--head {
  background: var(--docs-surface-strong);
  color: var(--docs-muted);
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.docs-table--status .docs-table__row,
.docs-table--artifacts .docs-table__row {
  grid-template-columns: minmax(9rem, 0.9fr) minmax(0, 1.8fr);
}

.docs-table strong {
  color: var(--docs-heading);
}

.docs-process-list {
  display: grid;
  gap: 0.7rem;
  margin: 1.4rem 0;
  padding: 0;
  list-style: none;
}

.docs-process-list li {
  display: grid;
  grid-template-columns: 2.4rem minmax(0, 1fr);
  gap: 0.9rem;
  align-items: start;
  border: 1px solid var(--docs-border);
  border-radius: 0.7rem;
  background: var(--docs-surface);
  padding: 0.85rem 1rem;
}

.docs-process-list span {
  display: grid;
  width: 2.4rem;
  height: 2.4rem;
  place-items: center;
  border-radius: 999px;
  background: var(--docs-heading);
  color: var(--docs-bg);
  font-size: 0.72rem;
  font-weight: 800;
}

.docs-process-list p {
  margin: 0;
  color: var(--docs-body);
  font-size: 0.93rem;
  line-height: 1.55;
}

.docs-troubleshooting {
  display: grid;
  gap: 0.8rem;
}

.docs-finish {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  margin-top: 2.2rem;
  border-top: 1px solid var(--docs-border);
  padding-top: 1.5rem;
}

.docs-finish svg {
  color: var(--docs-accent-strong);
}

.docs-finish p {
  margin: 0;
}

.docs-finish a {
  display: inline-flex;
  align-items: center;
  min-height: 2.3rem;
  border: 1px solid var(--docs-heading);
  border-radius: 999px;
  background: var(--docs-heading);
  padding: 0 0.9rem;
  color: var(--docs-bg);
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.docs-finish a:hover {
  background: var(--docs-accent);
  color: #1f1f1f;
}

@media (max-width: 1180px) {
  .docs-card-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 980px) {
  .docs-layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.75rem;
    padding-top: 2rem;
  }

  .docs-hero {
    padding-bottom: 2rem;
  }

  .docs-table__row,
  .docs-table--status .docs-table__row,
  .docs-table--artifacts .docs-table__row {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.35rem;
  }

  .docs-table__row--head {
    display: none;
  }

  .docs-finish {
    grid-template-columns: minmax(0, 1fr);
  }

  .docs-finish a {
    justify-content: center;
    width: fit-content;
  }
}

@media (max-width: 640px) {
  .docs-backbar__button {
    padding-inline: 1rem;
  }

  .docs-layout {
    padding-inline: 1rem;
    padding-bottom: 4rem;
  }

  .docs-hero h1 {
    font-size: 3rem;
  }

  .docs-process-list li {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (prefers-reduced-motion: reduce) {
  .docs-backbar__button,
  .docs-finish a {
    transition: none;
  }

  .docs-backbar__button:hover {
    transform: none;
  }
}
</style>
