<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileCode2,
  Globe,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-vue-next'
import PublishReviewSummary from '@/components/publish/PublishReviewSummary.vue'
import PublishStepIndicator from '@/components/publish/PublishStepIndicator.vue'
import { supabase } from '@/lib/supabase'
import { getSupabaseFunctionErrorMessage } from '@/lib/supabaseErrors'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'

const auth = useAuthStore()
const toast = useToastStore()
void auth.initialize()

type PublishStep = 'source' | 'details' | 'review'
type ResourceType = 'site' | 'skill'
type SubmitStatus = 'idle' | 'loading' | 'success' | 'error'

interface SubmissionPayload {
  name: string
  url: string
  description: string
  category: string
  submitter_note: string | null
}

interface SubmitToolResponse {
  ok?: boolean
  error?: string
}

interface CategoryOption {
  label: string
  value: string
}

const PUBLISH_STEPS = [
  {
    id: 'source',
    label: 'Source',
    description: 'Capture the link or repo first.',
  },
  {
    id: 'details',
    label: 'Details',
    description: 'Prepare searchable catalog metadata.',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Queue it for admin approval.',
  },
]

const RESOURCE_TYPES = [
  {
    value: 'site',
    label: 'Site or tool',
    description: 'Websites, apps, libraries, templates, references, and services.',
    icon: Globe,
  },
  {
    value: 'skill',
    label: 'Skill',
    description: 'Agent instructions, workflow packs, prompts, and reusable operating guides.',
    icon: Sparkles,
  },
] satisfies {
  value: ResourceType
  label: string
  description: string
  icon: typeof Globe
}[]

const CATEGORY_OPTIONS: Record<ResourceType, CategoryOption[]> = {
  site: [
    { label: 'Development - Cloud & Hosting', value: 'Development - Cloud & Hosting' },
    { label: 'Development - Learning', value: 'Development - Learning' },
    { label: 'Development - References', value: 'Development - References' },
    { label: 'Development - Tooling', value: 'Development - Tooling' },
    { label: 'Development - CLI Tools', value: 'Development - CLI Tools' },
    { label: 'Development - UI Libraries', value: 'Development - UI Libraries' },
    { label: 'Development - Repositories', value: 'Development - Repositories' },
    { label: 'Development - MCP', value: 'Development - MCP' },
    { label: 'Development - Monitoring', value: 'Development - Monitoring' },
    { label: 'AI - API', value: 'AI - API' },
    { label: 'AI - Automation', value: 'AI - Automation' },
    { label: 'AI - Chat', value: 'AI - Chat' },
    { label: 'AI - Image', value: 'AI - Image' },
    { label: 'AI - Video', value: 'AI - Video' },
    { label: 'AI - Other', value: 'AI - Other' },
    { label: 'Design - Inspiration', value: 'Design - Inspiration' },
    { label: 'Design - Fonts', value: 'Design - Fonts' },
    { label: 'Design - Icons/SVG', value: 'Design - Icons/SVG' },
    { label: 'Design - Tools', value: 'Design - Tools' },
    { label: 'Other', value: 'Other' },
  ],
  skill: [
    { label: 'Skills - Agent workflow', value: 'Skills - Agent workflow' },
    { label: 'Skills - Frontend/UI', value: 'Skills - Frontend/UI' },
    { label: 'Skills - Backend/API', value: 'Skills - Backend/API' },
    { label: 'Skills - Data/ML', value: 'Skills - Data/ML' },
    { label: 'Skills - DevOps/Deploy', value: 'Skills - DevOps/Deploy' },
    { label: 'Skills - Security/Review', value: 'Skills - Security/Review' },
    { label: 'Skills - Research/Writing', value: 'Skills - Research/Writing' },
    { label: 'Skills - Other', value: 'Skills - Other' },
  ],
}

const status = shallowRef<SubmitStatus>('idle')
const activeStep = shallowRef<PublishStep>('source')
const stepTransitionName = shallowRef('publish-slide-forward')
const resourceType = shallowRef<ResourceType>('site')
const errorMessage = shallowRef<string | null>(null)

const name = shallowRef('')
const url = shallowRef('')
const description = shallowRef('')
const category = shallowRef('')
const submitterNote = shallowRef('')

const selectedCategoryOptions = computed(() => CATEGORY_OPTIONS[resourceType.value])
const resourceTypeLabel = computed(() =>
  RESOURCE_TYPES.find(option => option.value === resourceType.value)?.label ?? 'Resource',
)
const showAnonymousSubmitNotice = computed(() => auth.initialized && !auth.isAuthenticated)

const sourceError = computed(() => {
  const trimmedUrl = url.value.trim()
  if (!trimmedUrl) return 'URL is required.'
  if (!/^https?:\/\/.+/.test(trimmedUrl)) return 'URL must start with http:// or https://.'
  return null
})

const detailsErrors = computed(() => {
  const errors: string[] = []
  if (!name.value.trim()) errors.push('Name is required.')
  if (!description.value.trim()) errors.push('Description is required.')
  if (!category.value) errors.push('Please select a category.')
  return errors
})

const formErrors = computed(() => {
  const errors = [...detailsErrors.value]
  if (sourceError.value) errors.unshift(sourceError.value)
  return errors
})

const hasValidSource = computed(() => Boolean(url.value.trim()) && !sourceError.value)
const hasCompleteDetails = computed(() => detailsErrors.value.length === 0)

const completedStepIds = computed(() => {
  const stepIds: string[] = []
  if (hasValidSource.value) stepIds.push('source')
  if (hasCompleteDetails.value) stepIds.push('details')
  if (status.value === 'success') stepIds.push('review')
  return stepIds
})

const canContinue = computed(() => {
  if (activeStep.value === 'source') return hasValidSource.value
  if (activeStep.value === 'details') return hasCompleteDetails.value
  return formErrors.value.length === 0
})

const nextButtonLabel = computed(() => {
  if (activeStep.value === 'source') return 'Continue to details'
  if (activeStep.value === 'details') return 'Review submission'
  return 'Submit for review'
})

const fullProcessLabel = computed(
  () => 'Source -> Details -> Review -> Admin approval -> Public listing',
)

watch(resourceType, () => {
  const categoryStillApplies = selectedCategoryOptions.value.some(option => option.value === category.value)
  if (!categoryStillApplies) {
    category.value = ''
  }
})

function validateActiveStep() {
  if (activeStep.value === 'source') return sourceError.value
  if (activeStep.value === 'details') return detailsErrors.value[0] ?? null
  return formErrors.value[0] ?? null
}

function goNext() {
  const validationError = validateActiveStep()
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  errorMessage.value = null
  stepTransitionName.value = 'publish-slide-forward'

  if (activeStep.value === 'source') {
    activeStep.value = 'details'
    return
  }

  if (activeStep.value === 'details') {
    activeStep.value = 'review'
  }
}

function goBack() {
  errorMessage.value = null
  stepTransitionName.value = 'publish-slide-back'

  if (activeStep.value === 'review') {
    activeStep.value = 'details'
    return
  }

  if (activeStep.value === 'details') {
    activeStep.value = 'source'
  }
}

function getReviewerNote() {
  const note = submitterNote.value.trim()
  const typeNote = `Resource type: ${resourceTypeLabel.value}`
  return note ? `${typeNote}\n\n${note}` : typeNote
}

async function handleSubmit() {
  const validationError = formErrors.value[0] ?? null
  if (validationError) {
    errorMessage.value = validationError
    return
  }

  if (!supabase) {
    errorMessage.value = 'Supabase is not configured. Add env vars to .env.local.'
    return
  }

  status.value = 'loading'
  errorMessage.value = null

  try {
    const submission: SubmissionPayload = {
      name: name.value.trim(),
      url: url.value.trim(),
      description: description.value.trim(),
      category: category.value,
      submitter_note: getReviewerNote(),
    }

    const { data, error } = await supabase.functions.invoke<SubmitToolResponse>('submit-tool', {
      body: { submission },
    })

    if (error) throw error
    if (!data?.ok) throw new Error(data?.error || 'Submission failed. Please try again.')

    status.value = 'success'
    toast.success(
      'Submission queued',
      'An admin will review it before it is added to the catalog.',
    )
  } catch (err) {
    status.value = 'error'
    errorMessage.value = await getSupabaseFunctionErrorMessage(
      err,
      'Submission failed. Please try again.',
    )
  }
}

function resetForm() {
  status.value = 'idle'
  activeStep.value = 'source'
  stepTransitionName.value = 'publish-slide-forward'
  errorMessage.value = null
  resourceType.value = 'site'
  name.value = ''
  url.value = ''
  description.value = ''
  category.value = ''
  submitterNote.value = ''
}
</script>

<template>
  <div class="min-h-full bg-[#1f1f1f] text-white">
    <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div class="mb-8 border-b border-gray-800 pb-8">
        <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-accent-300">
          Community Intake
        </p>
        <div>
          <h1 class="text-3xl font-bold tracking-normal text-white sm:text-4xl">
            Publish to Holy Grail
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
            Submit a site, tool, or skill into a moderated queue. Approved items are added to the
            catalog before they become public.
          </p>
          <p class="mt-4 text-xs font-semibold uppercase tracking-widest text-gray-500">
            {{ fullProcessLabel }}
          </p>
        </div>
      </div>

      <div
        v-if="status === 'success'"
        class="border border-emerald-400/30 bg-emerald-400/10 p-8 text-center"
      >
        <CheckCircle2 class="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 class="mb-2 text-2xl font-bold text-white">Queued for admin review</h2>
        <p class="mx-auto mb-6 max-w-xl text-sm leading-6 text-gray-300">
          Your submission is saved as pending. An admin will review it before it appears in the
          public catalog.
        </p>
        <button
          type="button"
          class="inline-flex h-10 items-center gap-2 border border-gray-700 px-5 text-sm font-semibold text-gray-200 transition hover:border-accent-400 hover:text-accent-100"
          @click="resetForm"
        >
          Submit another
        </button>
      </div>

      <template v-else>
        <div
          v-if="showAnonymousSubmitNotice"
          class="anonymous-submit-notice mb-6 flex gap-3 border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm leading-6 text-amber-100"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
          <span>
            You are submitting while not logged in. The submission will still go to admin review,
            but it will not be attached to your account.
            <RouterLink
              :to="{ name: 'login', query: { redirect: '/publish' } }"
              class="font-semibold underline hover:text-white"
            >
              Sign in first
            </RouterLink>
            to link it to your profile.
          </span>
        </div>

        <PublishStepIndicator
          class="mb-6"
          :steps="PUBLISH_STEPS"
          :active-step="activeStep"
          :completed-step-ids="completedStepIds"
        />

        <form
          class="overflow-hidden border border-gray-800 bg-[#1f1f1f] p-5 sm:p-6"
          @submit.prevent="activeStep === 'review' ? handleSubmit() : goNext()"
        >
          <div
            v-if="errorMessage"
            class="mb-6 flex gap-3 border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm leading-6 text-red-100"
          >
            <AlertCircle class="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <Transition :name="stepTransitionName" mode="out-in">
            <section
              v-if="activeStep === 'source'"
              key="source"
              aria-labelledby="publish-source-title"
            >
                <p class="text-xs font-semibold uppercase tracking-widest text-accent-300">
                  Step 1
                </p>
                <h2 id="publish-source-title" class="mt-2 text-2xl font-bold text-white">
                  Source input
                </h2>
                <p class="mt-2 text-sm leading-6 text-gray-500">
                  Start with the canonical URL. For skills, use the repo or page that contains the
                  skill instructions.
                </p>

                <div class="mt-6 grid gap-3 sm:grid-cols-2">
                  <button
                    v-for="option in RESOURCE_TYPES"
                    :key="option.value"
                    type="button"
                    class="flex min-h-32 gap-3 border p-4 text-left transition"
                    :class="
                      resourceType === option.value
                        ? 'border-accent-400/70 bg-accent-500/10'
                        : 'border-gray-800 bg-[#1f1f1f] hover:border-gray-700'
                    "
                    @click="resourceType = option.value"
                  >
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center border"
                      :class="
                        resourceType === option.value
                          ? 'border-accent-300/50 text-accent-100'
                          : 'border-gray-800 text-gray-500'
                      "
                    >
                      <component :is="option.icon" class="h-4 w-4" />
                    </span>
                    <span>
                      <span class="block text-sm font-bold text-white">{{ option.label }}</span>
                      <span class="mt-2 block text-xs leading-5 text-gray-500">
                        {{ option.description }}
                      </span>
                    </span>
                  </button>
                </div>

                <label class="mt-6 block">
                  <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                    Source URL <span class="text-red-400">*</span>
                  </span>
                  <span class="relative block">
                    <Globe class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      v-model="url"
                      type="url"
                      placeholder="https://example.com"
                      :disabled="status === 'loading'"
                      class="h-12 w-full border border-zinc-700 bg-[#1f1f1f] pl-10 pr-4 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </span>
                </label>

                <div class="mt-4 flex gap-3 border border-gray-800 bg-[#1f1f1f]/60 px-4 py-3 text-sm leading-6 text-gray-400">
                  <FileCode2 class="mt-0.5 h-4 w-4 shrink-0 text-accent-300" />
                  <span>
                    This step validates the source format only. Admins still inspect quality, fit,
                    safety, duplication, and whether the item belongs in sites or skills.
                  </span>
                </div>
              </section>

              <section
                v-else-if="activeStep === 'details'"
                key="details"
                aria-labelledby="publish-details-title"
              >
                <p class="text-xs font-semibold uppercase tracking-widest text-accent-300">
                  Step 2
                </p>
                <h2 id="publish-details-title" class="mt-2 text-2xl font-bold text-white">
                  Draft catalog metadata
                </h2>
                <p class="mt-2 text-sm leading-6 text-gray-500">
                  These fields help the admin place the item without guessing. They can still adjust
                  taxonomy and final copy before publishing.
                </p>

                <div class="mt-6 grid gap-5">
                  <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Name <span class="text-red-400">*</span>
                    </span>
                    <input
                      v-model="name"
                      type="text"
                      placeholder="e.g. Coolify"
                      :disabled="status === 'loading'"
                      class="h-12 w-full border border-zinc-700 bg-[#1f1f1f] px-4 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Category <span class="text-red-400">*</span>
                    </span>
                    <select
                      v-model="category"
                      :disabled="status === 'loading'"
                      class="h-12 w-full border border-zinc-700 bg-[#1f1f1f] px-4 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="" disabled>Select a category...</option>
                      <option
                        v-for="cat in selectedCategoryOptions"
                        :key="cat.value"
                        :value="cat.value"
                      >
                        {{ cat.label }}
                      </option>
                    </select>
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Short description <span class="text-red-400">*</span>
                    </span>
                    <textarea
                      v-model="description"
                      rows="3"
                      placeholder="What does it do? Why is it useful?"
                      :disabled="status === 'loading'"
                      class="w-full resize-none border border-zinc-700 bg-[#1f1f1f] px-4 py-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
                    ></textarea>
                  </label>

                  <label class="block">
                    <span class="mb-2 block text-xs font-semibold uppercase tracking-widest text-zinc-500">
                      Note for reviewers
                      <span class="ml-1 font-normal normal-case tracking-normal text-zinc-600">
                        optional
                      </span>
                    </span>
                    <textarea
                      v-model="submitterNote"
                      rows="3"
                      placeholder="Anything the reviewer should know..."
                      :disabled="status === 'loading'"
                      class="w-full resize-none border border-zinc-700 bg-[#1f1f1f] px-4 py-3 text-sm text-white outline-none transition focus:border-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
                    ></textarea>
                  </label>
                </div>
              </section>

              <section v-else key="review">
                <PublishReviewSummary
                  :resource-type-label="resourceTypeLabel"
                  :name="name"
                  :url="url"
                  :description="description"
                  :category="category"
                  :submitter-note="submitterNote"
                />
              </section>
            </Transition>

          <div class="mt-8 flex flex-col gap-3 border-t border-gray-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              class="inline-flex h-11 items-center justify-center gap-2 border border-gray-800 px-4 text-sm font-semibold text-gray-300 transition hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="activeStep === 'source' || status === 'loading'"
              @click="goBack"
            >
              <ArrowLeft class="h-4 w-4" />
              Back
            </button>

            <button
              v-if="activeStep !== 'review'"
              type="button"
              :disabled="status === 'loading'"
              class="inline-flex h-11 items-center justify-center gap-2 bg-white px-5 text-sm font-bold text-[#1f1f1f] transition hover:bg-accent-200 disabled:cursor-not-allowed disabled:opacity-60"
              @click="goNext"
            >
              <span>{{ nextButtonLabel }}</span>
              <ArrowRight class="h-4 w-4" />
            </button>

            <button
              v-else
              type="submit"
              :disabled="status === 'loading' || !canContinue"
              class="inline-flex h-11 items-center justify-center gap-2 bg-white px-5 text-sm font-bold text-[#1f1f1f] transition hover:bg-accent-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Loader2 v-if="status === 'loading'" class="h-4 w-4 animate-spin" />
              <Send v-else class="h-4 w-4" />
              <span>{{ status === 'loading' ? 'Submitting...' : nextButtonLabel }}</span>
            </button>
          </div>
        </form>
      </template>
    </div>
  </div>
</template>

<style scoped>
.publish-slide-forward-enter-active,
.publish-slide-forward-leave-active,
.publish-slide-back-enter-active,
.publish-slide-back-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.22, 1, 0.36, 1);
}

.publish-slide-forward-enter-from {
  opacity: 0;
  transform: translateX(28px);
}

.publish-slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-28px);
}

.publish-slide-back-enter-from {
  opacity: 0;
  transform: translateX(-28px);
}

.publish-slide-back-leave-to {
  opacity: 0;
  transform: translateX(28px);
}

@media (prefers-reduced-motion: reduce) {
  .publish-slide-forward-enter-active,
  .publish-slide-forward-leave-active,
  .publish-slide-back-enter-active,
  .publish-slide-back-leave-active {
    transition: none;
  }
}
</style>
