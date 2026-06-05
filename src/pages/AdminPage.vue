<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { AlertTriangle, BarChart3, Inbox, Settings, ShieldAlert } from 'lucide-vue-next'
import AdminAnalyticsPanel from '@/components/admin/AdminAnalyticsPanel.vue'
import AdminSettingsPanel from '@/components/admin/AdminSettingsPanel.vue'
import AdminSiteIssuesPanel from '@/components/admin/AdminSiteIssuesPanel.vue'
import AdminSubmissionsPanel from '@/components/admin/AdminSubmissionsPanel.vue'
import { useAdminStore } from '@/stores/admin'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const admin = useAdminStore()
const router = useRouter()

type AdminSection = 'analytics' | 'submissions' | 'site-issues' | 'settings'
const activeSection = shallowRef<AdminSection>('analytics')

const sections = [
  { icon: BarChart3, label: 'Analytics', value: 'analytics' },
  { icon: Inbox, label: 'Submissions', value: 'submissions' },
  { icon: AlertTriangle, label: 'Site Issues', value: 'site-issues' },
  { icon: Settings, label: 'Settings', value: 'settings' },
] satisfies { icon: typeof BarChart3; label: string; value: AdminSection }[]

onMounted(async () => {
  await auth.initialize()

  if (!auth.isAuthenticated) {
    await router.push({ name: 'login', query: { redirect: '/admin' } })
    return
  }

  if (!admin.isAdmin) return

  await Promise.all([
    admin.loadAnalytics(),
    admin.loadAnalyticsSettings(),
    admin.loadOptionalCounts(),
    admin.loadSiteIssueReports(),
    admin.loadSubmissions(),
  ])
})
</script>

<template>
  <div class="min-h-full bg-[#1f1f1f] text-white">
    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div class="mb-8 border-b border-gray-800 pb-8">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Admin
        </p>
        <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 class="text-3xl font-bold tracking-normal text-white sm:text-4xl">
              Control room
            </h1>
            <p class="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
              Monitor visitors, review submissions, triage broken sites, and tune analytics
              collection.
            </p>
          </div>

          <nav
            v-if="admin.isAdmin"
            class="flex w-full items-center gap-1 overflow-x-auto border border-gray-800 bg-[#1f1f1f] p-1 lg:w-auto"
            aria-label="Admin sections"
          >
            <button
              v-for="section in sections"
              :key="section.value"
              type="button"
              class="inline-flex h-10 shrink-0 items-center gap-2 px-3 text-xs font-semibold uppercase tracking-widest transition"
              :class="
                activeSection === section.value
                  ? 'bg-[#1f1f1f] text-white'
                  : 'text-gray-500 hover:text-gray-300'
              "
              @click="activeSection = section.value"
            >
              <component :is="section.icon" class="h-4 w-4" />
              {{ section.label }}
              <span
                v-if="section.value === 'submissions' && admin.pendingCount > 0"
                class="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-[#1f1f1f]"
              >
                {{ admin.pendingCount }}
              </span>
              <span
                v-if="section.value === 'site-issues' && admin.openSiteIssueCount > 0"
                class="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-[#1f1f1f]"
              >
                {{ admin.openSiteIssueCount }}
              </span>
            </button>
          </nav>
        </div>
      </div>

      <div
        v-if="!admin.isAdmin"
        class="flex flex-col items-center justify-center py-24 text-center"
      >
        <ShieldAlert class="mb-4 h-12 w-12 text-red-400" />
        <h2 class="mb-2 text-2xl font-bold text-white">Access denied</h2>
        <p class="max-w-xl text-sm text-gray-400">
          This page is restricted to admins. Your account does not have the
          <code class="mx-1 rounded bg-[#1f1f1f] px-1.5 py-0.5 text-xs text-accent-300">
            admin
          </code>
          role.
        </p>
      </div>

      <template v-else>
        <AdminAnalyticsPanel v-if="activeSection === 'analytics'" />
        <AdminSubmissionsPanel v-else-if="activeSection === 'submissions'" />
        <AdminSiteIssuesPanel v-else-if="activeSection === 'site-issues'" />
        <AdminSettingsPanel v-else />
      </template>
    </div>
  </div>
</template>
