<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowRight,
  Compass,
  FileText,
  Globe,
  Info,
  KeyRound,
  Laptop,
  Link2,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-vue-next'
import DocsCodeBlock from '@/components/docs/DocsCodeBlock.vue'
import McpClientTabs from '@/components/mcp/McpClientTabs.vue'
import {
  MCP_FALLBACK_ENDPOINT,
  MCP_NPM_PACKAGE,
  buildMcpClientConfigs,
  mcpServerEnvVars,
  mcpServerPrompts,
  mcpServerResources,
  mcpServerToolGroups,
} from '@/components/mcp/mcpServerTools'
import { useTheme } from '@/composables/useTheme'

const { isLightMode } = useTheme()

/**
 * The hosted endpoint is the `/mcp` rewrite on whichever deployment serves this page. Local dev
 * servers do not run the Vercel function, so they advertise the production endpoint instead.
 */
function resolveEndpoint() {
  if (typeof window === 'undefined') return MCP_FALLBACK_ENDPOINT

  const { origin, hostname } = window.location
  const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'

  if (!origin || origin === 'null' || isLocalHost) return MCP_FALLBACK_ENDPOINT

  return `${origin}/mcp`
}

const endpoint = resolveEndpoint()
const clients = computed(() => buildMcpClientConfigs(endpoint))

const connectionModes = [
  {
    title: 'Hosted',
    transport: 'Streamable HTTP',
    description: 'Point your client at the endpoint below. Nothing to install.',
    icon: Globe,
  },
  {
    title: 'Local',
    transport: 'stdio',
    description: `Run the ${MCP_NPM_PACKAGE} npm package with npx. Adds skill installs.`,
    icon: Laptop,
  },
]

const toolGroupIcons = {
  discover: Compass,
  details: FileText,
  skills: Sparkles,
  contribute: Send,
} as const

const toolGroups = mcpServerToolGroups.map((group) => ({
  ...group,
  icon: toolGroupIcons[group.id as keyof typeof toolGroupIcons] ?? FileText,
}))

const toolCount = mcpServerToolGroups.reduce((total, group) => total + group.tools.length, 0)
</script>

<template>
  <div
    class="mcp-server-page min-h-full bg-[#1f1f1f] text-white"
    :class="{ 'mcp-server-page--light': isLightMode }"
  >
    <header class="border-b border-gray-800">
      <div class="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16">
        <p class="mb-3 text-xs font-medium uppercase tracking-widest text-gray-500">MCP Server</p>
        <h1 class="mb-4 text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl">
          Holy Grail MCP server
        </h1>
        <p class="max-w-2xl text-base leading-relaxed text-gray-400">
          Let AI agents search and use the whole catalog — sites, Chrome extensions, MCP servers and
          AI skills — through {{ toolCount }} tools, ready-made prompts and resources.
        </p>

        <ul class="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2" aria-label="Ways to connect">
          <li
            v-for="mode in connectionModes"
            :key="mode.title"
            class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4"
          >
            <div class="flex items-center gap-2">
              <component :is="mode.icon" class="h-4 w-4 text-accent-400" aria-hidden="true" />
              <h2 class="text-sm font-semibold text-white">{{ mode.title }}</h2>
              <span class="rounded-md border border-gray-800 px-2 py-0.5 text-xs text-gray-500">
                {{ mode.transport }}
              </span>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-gray-400">{{ mode.description }}</p>
          </li>
        </ul>
      </div>
    </header>

    <div class="mx-auto max-w-5xl space-y-14 px-4 py-10 sm:px-6 sm:py-12">
      <section aria-labelledby="mcp-endpoint-heading">
        <h2 id="mcp-endpoint-heading" class="text-xl font-semibold text-white">Hosted endpoint</h2>
        <DocsCodeBlock label="Endpoint URL" :code="endpoint" copy-label="Copy endpoint URL" />
        <p class="flex items-start gap-2 text-sm text-gray-400">
          <Info class="mt-0.5 h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
          <span>Catalog data is fetched live from this site. No account or API key needed.</span>
        </p>
      </section>

      <section aria-labelledby="mcp-clients-heading">
        <h2 id="mcp-clients-heading" class="text-xl font-semibold text-white">
          Add it to your client
        </h2>
        <p class="mt-2 text-sm text-gray-400">
          Pick your client, then copy the hosted or local snippet.
        </p>
        <div class="mt-4">
          <McpClientTabs :clients="clients" />
        </div>
      </section>

      <section aria-labelledby="mcp-tools-heading">
        <h2 id="mcp-tools-heading" class="text-xl font-semibold text-white">Tools</h2>
        <p class="mt-2 text-sm text-gray-400">
          Every tool works on both transports unless marked
          <strong class="font-medium text-gray-300">Local only</strong>.
        </p>

        <div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <article
            v-for="group in toolGroups"
            :key="group.id"
            class="rounded-xl border border-gray-800 bg-[#1f1f1f] p-4"
            :aria-labelledby="`mcp-tools-${group.id}`"
          >
            <div class="flex items-center gap-2">
              <component :is="group.icon" class="h-4 w-4 text-accent-400" aria-hidden="true" />
              <h3 :id="`mcp-tools-${group.id}`" class="text-sm font-semibold text-white">
                {{ group.label }}
              </h3>
            </div>
            <p class="mt-1 text-xs text-gray-500">{{ group.description }}</p>

            <ul class="mt-3">
              <li
                v-for="tool in group.tools"
                :key="tool.name"
                class="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-t border-gray-800 py-2 first:border-t-0 first:pt-0 last:pb-0"
              >
                <code class="font-mono text-xs font-medium text-gray-200">{{ tool.name }}</code>
                <span
                  v-if="tool.localOnly"
                  class="rounded-md border border-accent-500/40 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-accent-500"
                >
                  Local only
                </span>
                <span class="w-full text-xs text-gray-400">{{ tool.description }}</span>
              </li>
            </ul>
          </article>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-10 md:grid-cols-2">
        <section aria-labelledby="mcp-prompts-heading">
          <h2
            id="mcp-prompts-heading"
            class="flex items-center gap-2 text-xl font-semibold text-white"
          >
            <MessageSquare class="h-4 w-4 text-accent-400" aria-hidden="true" />
            Prompts
          </h2>
          <ul class="mt-4 rounded-xl border border-gray-800 bg-[#1f1f1f]">
            <li
              v-for="prompt in mcpServerPrompts"
              :key="prompt.name"
              class="border-t border-gray-800 px-4 py-3 first:border-t-0"
            >
              <code class="font-mono text-xs font-medium text-gray-200">{{ prompt.name }}</code>
              <p class="mt-0.5 text-xs text-gray-400">{{ prompt.description }}</p>
            </li>
          </ul>
        </section>

        <section aria-labelledby="mcp-resources-heading">
          <h2
            id="mcp-resources-heading"
            class="flex items-center gap-2 text-xl font-semibold text-white"
          >
            <Link2 class="h-4 w-4 text-accent-400" aria-hidden="true" />
            Resources
          </h2>
          <ul class="mt-4 rounded-xl border border-gray-800 bg-[#1f1f1f]">
            <li
              v-for="resource in mcpServerResources"
              :key="resource.uri"
              class="border-t border-gray-800 px-4 py-3 first:border-t-0"
            >
              <code class="font-mono text-xs font-medium break-all text-gray-200">{{
                resource.uri
              }}</code>
              <p class="mt-0.5 text-xs text-gray-400">{{ resource.description }}</p>
            </li>
          </ul>
        </section>
      </div>

      <section aria-labelledby="mcp-env-heading">
        <h2 id="mcp-env-heading" class="flex items-center gap-2 text-xl font-semibold text-white">
          <KeyRound class="h-4 w-4 text-accent-400" aria-hidden="true" />
          Environment variables (local)
        </h2>
        <p class="mt-2 text-sm text-gray-400">
          Optional. Set them in your client's <code class="font-mono text-gray-300">env</code> block
          for the local server.
        </p>
        <dl class="mt-4 rounded-xl border border-gray-800 bg-[#1f1f1f]">
          <div
            v-for="variable in mcpServerEnvVars"
            :key="variable.name"
            class="flex flex-col gap-1 border-t border-gray-800 px-4 py-3 first:border-t-0 sm:flex-row sm:items-baseline sm:gap-4"
          >
            <dt class="font-mono text-xs font-medium text-gray-200 sm:w-56 sm:shrink-0">
              {{ variable.name }}
            </dt>
            <dd class="text-xs text-gray-400">{{ variable.description }}</dd>
          </div>
        </dl>
      </section>

      <RouterLink
        to="/mcp/development"
        class="group inline-flex items-center gap-2 text-sm font-medium text-accent-500 transition-colors hover:text-accent-400"
      >
        Browse MCP servers in the catalog
        <ArrowRight
          class="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
/* Tokens DocsCodeBlock reads, matched to the docs page palette for each theme. */
.mcp-server-page {
  --docs-border: #2d2925;
  --docs-muted: #91877c;
  --docs-code-bg: #1f1f1f;
  --docs-code-text: #f5eee6;
  --docs-surface-strong: #1f1f1f;
  --docs-accent-strong: #ff9b3d;
  --docs-warning-bg: rgba(255, 138, 31, 0.14);
  --docs-warning: #ffb15a;
}

.mcp-server-page--light {
  --docs-border: #e4ded7;
  --docs-muted: #6f6b64;
  --docs-code-bg: #ffffff;
  --docs-code-text: #24201b;
  --docs-surface-strong: #f1eee9;
  --docs-accent-strong: #d46600;
  --docs-warning-bg: #fff4e8;
  --docs-warning: #b65300;
}
</style>
