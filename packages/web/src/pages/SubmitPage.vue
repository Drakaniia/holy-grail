<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-vue-next'
import PublishReviewSummary from '@/components/publish/PublishReviewSummary.vue'
import PublishSpecimenCard from '@/components/publish/PublishSpecimenCard.vue'
import PublishStepIndicator from '@/components/publish/PublishStepIndicator.vue'
import posthog from 'posthog-js'
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
    doneLabel: 'Source captured',
  },
  {
    id: 'details',
    label: 'Details',
    description: 'Prepare searchable catalog metadata.',
    doneLabel: 'Details complete',
  },
  {
    id: 'review',
    label: 'Review',
    description: 'Queue it for admin approval.',
    doneLabel: 'Queued for review',
  },
]

const RESOURCE_TYPES = [
  {
    value: 'site',
    label: 'Site or tool',
    description: 'Websites, apps, libraries, templates, references, and services.',
  },
  {
    value: 'skill',
    label: 'Skill',
    description: 'Agent instructions, workflow packs, prompts, and reusable operating guides.',
  },
] satisfies {
  value: ResourceType
  label: string
  description: string
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
/** Steps the visitor has tried to leave, which is when their fields start showing errors. */
const attemptedSteps = shallowRef<ReadonlySet<PublishStep>>(new Set<PublishStep>())
/** Field errors live next to the field, so the only thing announced is the reason. */
const announcement = shallowRef('')

const name = shallowRef('')
const url = shallowRef('')
const description = shallowRef('')
const category = shallowRef('')
const submitterNote = shallowRef('')

const selectedCategoryOptions = computed(() => CATEGORY_OPTIONS[resourceType.value])
const resourceTypeLabel = computed(
  () => RESOURCE_TYPES.find((option) => option.value === resourceType.value)?.label ?? 'Resource',
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

const urlFieldError = computed(() =>
  attemptedSteps.value.has('source') ? sourceError.value : null,
)
const nameFieldError = computed(() =>
  attemptedSteps.value.has('details') && !name.value.trim() ? 'Name is required.' : null,
)
const categoryFieldError = computed(() =>
  attemptedSteps.value.has('details') && !category.value ? 'Select a category.' : null,
)
const descriptionFieldError = computed(() =>
  attemptedSteps.value.has('details') && !description.value.trim()
    ? 'Description is required.'
    : null,
)

const hasValidSource = computed(() => Boolean(url.value.trim()) && !sourceError.value)
const hasCompleteDetails = computed(() => detailsErrors.value.length === 0)

const completedStepIds = computed(() => {
  const stepIds: string[] = []
  if (hasValidSource.value) stepIds.push('source')
  if (hasCompleteDetails.value) stepIds.push('details')
  if (status.value === 'success') stepIds.push('review')
  return stepIds
})

const activeStepIndex = computed(() =>
  PUBLISH_STEPS.findIndex((step) => step.id === activeStep.value),
)

const progressLabel = computed(() => `Step ${activeStepIndex.value + 1} of ${PUBLISH_STEPS.length}`)

const nextButtonLabel = computed(() => {
  if (activeStep.value === 'source') return 'Continue to details'
  if (activeStep.value === 'details') return 'Review submission'
  return 'Submit for review'
})

watch(resourceType, () => {
  const categoryStillApplies = selectedCategoryOptions.value.some(
    (option) => option.value === category.value,
  )
  if (!categoryStillApplies) {
    category.value = ''
  }
})

function markAttempted(step: PublishStep) {
  if (attemptedSteps.value.has(step)) return
  const next = new Set(attemptedSteps.value)
  next.add(step)
  attemptedSteps.value = next
}

function validateActiveStep() {
  if (activeStep.value === 'source') return sourceError.value
  if (activeStep.value === 'details') return detailsErrors.value[0] ?? null
  return formErrors.value[0] ?? null
}

function goNext() {
  const validationError = validateActiveStep()
  if (validationError) {
    markAttempted(activeStep.value)
    announcement.value = `Cannot continue. ${validationError}`
    return
  }

  announcement.value = ''
  errorMessage.value = null
  stepTransitionName.value = 'publish-slide-forward'

  if (activeStep.value === 'source') {
    posthog.capture('submission_step_completed', {
      step: 'source',
      resource_type: resourceType.value,
    })
    activeStep.value = 'details'
    return
  }

  if (activeStep.value === 'details') {
    posthog.capture('submission_step_completed', {
      step: 'details',
      resource_type: resourceType.value,
      category: category.value,
    })
    activeStep.value = 'review'
  }
}

function goBack() {
  announcement.value = ''
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
    attemptedSteps.value = new Set<PublishStep>(['source', 'details'])
    announcement.value = `Cannot submit. ${validationError}`
    stepTransitionName.value = 'publish-slide-back'
    activeStep.value = sourceError.value ? 'source' : 'details'
    return
  }

  if (!supabase) {
    errorMessage.value = 'Supabase is not configured. Add env vars to .env.local.'
    return
  }

  status.value = 'loading'
  errorMessage.value = null
  announcement.value = ''

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
    posthog.capture('submission_submitted', {
      resource_type: resourceType.value,
      category: category.value,
      is_authenticated: auth.isAuthenticated,
    })
    toast.success('Submission queued', 'An admin will review it before it is added to the catalog.')
  } catch (err) {
    status.value = 'error'
    errorMessage.value = await getSupabaseFunctionErrorMessage(
      err,
      'Submission failed. Please try again.',
    )
    posthog.capture('submission_failed', {
      resource_type: resourceType.value,
      error_message: errorMessage.value,
    })
  }
}

function resetForm() {
  status.value = 'idle'
  activeStep.value = 'source'
  stepTransitionName.value = 'publish-slide-forward'
  errorMessage.value = null
  announcement.value = ''
  attemptedSteps.value = new Set<PublishStep>()
  resourceType.value = 'site'
  name.value = ''
  url.value = ''
  description.value = ''
  category.value = ''
  submitterNote.value = ''
}
</script>

<template>
  <div class="publish">
    <div class="publish__frame">
      <header class="publish__masthead">
        <div class="publish__masthead-main">
          <h1 class="publish__title">Publish to the catalog.</h1>
          <p class="publish__lede">
            Submit a site, tool, or skill into a moderated queue. Approved items are added to the
            catalog before they become public.
          </p>
        </div>
        <p class="publish__aside">
          One item per submission. Nothing is published without an admin review.
        </p>
      </header>

      <p class="sr-only" role="status" aria-live="polite">{{ announcement }}</p>

      <section
        v-if="status === 'success'"
        class="publish-receipt"
        role="status"
        aria-labelledby="publish-receipt-title"
      >
        <div class="publish-receipt__head">
          <h2 id="publish-receipt-title" class="publish-receipt__title">Queued for review.</h2>
          <span class="publish-receipt__status">Pending</span>
        </div>

        <dl class="publish-receipt__rows">
          <div class="publish-receipt__row">
            <dt>Name</dt>
            <dd>{{ name }}</dd>
          </div>
          <div class="publish-receipt__row">
            <dt>Category</dt>
            <dd>{{ category }}</dd>
          </div>
          <div class="publish-receipt__row">
            <dt>Source</dt>
            <dd>
              <a
                :href="url"
                target="_blank"
                rel="noopener noreferrer"
                class="publish-receipt__link"
              >
                {{ url }}
              </a>
            </dd>
          </div>
        </dl>

        <p class="publish-receipt__note">
          An admin will review it before it appears in the public catalog. Approved items are added
          to sites or skills.
        </p>

        <div class="publish-receipt__actions">
          <button type="button" class="publish-btn publish-btn--ghost" @click="resetForm">
            Submit another
          </button>
        </div>
      </section>

      <div v-else class="publish__body">
        <aside class="publish__rail">
          <PublishStepIndicator
            :steps="PUBLISH_STEPS"
            :active-step="activeStep"
            :completed-step-ids="completedStepIds"
          />

          <div v-if="showAnonymousSubmitNotice" class="publish-note">
            <p class="publish-note__title">Not signed in</p>
            <p class="publish-note__body">
              The submission still reaches admin review, but it will not be attached to your
              account.
              <RouterLink
                :to="{ name: 'login', query: { redirect: '/publish' } }"
                class="publish-note__link"
              >
                Sign in first
              </RouterLink>
              to link it to your profile.
            </p>
          </div>

          <div class="publish-after">
            <p class="publish-after__title">After you queue it</p>
            <ol class="publish-after__list">
              <li>An admin checks fit, quality, duplication, and safety.</li>
              <li>Approved items are added to sites or skills.</li>
            </ol>
          </div>
        </aside>

        <div class="publish-sheet">
          <p v-if="errorMessage" class="publish-alert" role="alert">
            <AlertCircle class="publish-alert__icon" aria-hidden="true" />
            <span>{{ errorMessage }}</span>
          </p>

          <form
            class="publish-form"
            novalidate
            @submit.prevent="activeStep === 'review' ? handleSubmit() : goNext()"
          >
            <Transition :name="stepTransitionName" mode="out-in">
              <section
                v-if="activeStep === 'source'"
                key="source"
                class="publish-step"
                aria-labelledby="publish-source-title"
              >
                <header class="publish-step__head">
                  <span class="publish-step__num" aria-hidden="true">01</span>
                  <div class="publish-step__titles">
                    <h2 id="publish-source-title" class="publish-step__title">
                      Where does it live?
                    </h2>
                    <p class="publish-step__lede">
                      Start with the canonical URL. For skills, use the repo or page that holds the
                      instructions.
                    </p>
                  </div>
                </header>

                <fieldset class="publish-kinds">
                  <legend class="publish-kinds__legend">Kind of resource</legend>

                  <label
                    v-for="option in RESOURCE_TYPES"
                    :key="option.value"
                    class="publish-kind"
                    :class="{ 'is-selected': resourceType === option.value }"
                  >
                    <input
                      v-model="resourceType"
                      class="publish-kind__input"
                      type="radio"
                      name="publish-resource-type"
                      :value="option.value"
                      :disabled="status === 'loading'"
                    />
                    <span class="publish-kind__mark" aria-hidden="true"></span>
                    <span class="publish-kind__copy">
                      <span class="publish-kind__label">{{ option.label }}</span>
                      <span class="publish-kind__desc">{{ option.description }}</span>
                    </span>
                  </label>
                </fieldset>

                <div class="publish-field" :class="{ 'is-invalid': urlFieldError }">
                  <label class="publish-field__label" for="publish-url">
                    Source URL
                    <span class="publish-field__req">Required</span>
                  </label>
                  <div class="publish-field__control">
                    <input
                      id="publish-url"
                      v-model="url"
                      class="publish-input"
                      type="url"
                      inputmode="url"
                      autocomplete="off"
                      spellcheck="false"
                      placeholder="https://example.com"
                      :disabled="status === 'loading'"
                      :aria-invalid="urlFieldError ? 'true' : undefined"
                      :aria-describedby="urlFieldError ? 'publish-url-error' : 'publish-url-hint'"
                    />
                    <p v-if="urlFieldError" id="publish-url-error" class="publish-field__error">
                      {{ urlFieldError }}
                    </p>
                    <p v-else id="publish-url-hint" class="publish-field__hint">
                      Format check only. Admins still review fit, safety, duplication, and whether
                      it belongs under sites or skills.
                    </p>
                  </div>
                </div>
              </section>

              <section
                v-else-if="activeStep === 'details'"
                key="details"
                class="publish-step"
                aria-labelledby="publish-details-title"
              >
                <header class="publish-step__head">
                  <span class="publish-step__num" aria-hidden="true">02</span>
                  <div class="publish-step__titles">
                    <h2 id="publish-details-title" class="publish-step__title">
                      How should it be filed?
                    </h2>
                    <p class="publish-step__lede">
                      These fields become the catalog entry. An admin can still adjust taxonomy and
                      final copy before publishing.
                    </p>
                  </div>
                </header>

                <div class="publish-step__split">
                  <div class="publish-fields">
                    <div class="publish-field" :class="{ 'is-invalid': nameFieldError }">
                      <label class="publish-field__label" for="publish-name">
                        Name
                        <span class="publish-field__req">Required</span>
                      </label>
                      <div class="publish-field__control">
                        <input
                          id="publish-name"
                          v-model="name"
                          class="publish-input"
                          type="text"
                          autocomplete="off"
                          placeholder="e.g. Coolify"
                          :disabled="status === 'loading'"
                          :aria-invalid="nameFieldError ? 'true' : undefined"
                          :aria-describedby="nameFieldError ? 'publish-name-error' : undefined"
                        />
                        <p
                          v-if="nameFieldError"
                          id="publish-name-error"
                          class="publish-field__error"
                        >
                          {{ nameFieldError }}
                        </p>
                      </div>
                    </div>

                    <div class="publish-field" :class="{ 'is-invalid': categoryFieldError }">
                      <label class="publish-field__label" for="publish-category">
                        Category
                        <span class="publish-field__req">Required</span>
                      </label>
                      <div class="publish-field__control">
                        <div class="publish-select">
                          <select
                            id="publish-category"
                            v-model="category"
                            class="publish-input publish-input--select"
                            :disabled="status === 'loading'"
                            :aria-invalid="categoryFieldError ? 'true' : undefined"
                            :aria-describedby="
                              categoryFieldError ? 'publish-category-error' : undefined
                            "
                          >
                            <option value="" disabled>Select a category</option>
                            <option
                              v-for="cat in selectedCategoryOptions"
                              :key="cat.value"
                              :value="cat.value"
                            >
                              {{ cat.label }}
                            </option>
                          </select>
                          <span class="publish-select__chevron" aria-hidden="true"></span>
                        </div>
                        <p
                          v-if="categoryFieldError"
                          id="publish-category-error"
                          class="publish-field__error"
                        >
                          {{ categoryFieldError }}
                        </p>
                      </div>
                    </div>

                    <div class="publish-field" :class="{ 'is-invalid': descriptionFieldError }">
                      <label class="publish-field__label" for="publish-description">
                        Description
                        <span class="publish-field__req">Required</span>
                      </label>
                      <div class="publish-field__control">
                        <textarea
                          id="publish-description"
                          v-model="description"
                          class="publish-input publish-input--area"
                          rows="3"
                          placeholder="What does it do? Why is it useful?"
                          :disabled="status === 'loading'"
                          :aria-invalid="descriptionFieldError ? 'true' : undefined"
                          :aria-describedby="
                            descriptionFieldError ? 'publish-description-error' : undefined
                          "
                        ></textarea>
                        <p
                          v-if="descriptionFieldError"
                          id="publish-description-error"
                          class="publish-field__error"
                        >
                          {{ descriptionFieldError }}
                        </p>
                        <p v-else class="publish-field__hint">
                          One or two sentences. This is the copy visitors read in the catalog.
                        </p>
                      </div>
                    </div>

                    <div class="publish-field">
                      <label class="publish-field__label" for="publish-note">
                        Reviewer note
                        <span class="publish-field__req">Optional</span>
                      </label>
                      <div class="publish-field__control">
                        <textarea
                          id="publish-note"
                          v-model="submitterNote"
                          class="publish-input publish-input--area"
                          rows="2"
                          placeholder="Anything the reviewer should know"
                          :disabled="status === 'loading'"
                          aria-describedby="publish-note-hint"
                        ></textarea>
                        <p id="publish-note-hint" class="publish-field__hint">
                          Sent to the admin with the ticket. It is never shown publicly.
                        </p>
                      </div>
                    </div>
                  </div>

                  <PublishSpecimenCard
                    :resource-type-label="resourceTypeLabel"
                    :name="name"
                    :url="url"
                    :category="category"
                    :description="description"
                  />
                </div>
              </section>

              <section
                v-else
                key="review"
                class="publish-step"
                aria-labelledby="publish-review-title"
              >
                <header class="publish-step__head">
                  <span class="publish-step__num" aria-hidden="true">03</span>
                  <div class="publish-step__titles">
                    <h2 id="publish-review-title" class="publish-step__title">
                      Check the ticket before it goes in.
                    </h2>
                    <p class="publish-step__lede">
                      This is exactly what the reviewer receives, next to the card visitors will see
                      once it is approved.
                    </p>
                  </div>
                </header>

                <div class="publish-step__split publish-step__split--review">
                  <PublishReviewSummary
                    :resource-type-label="resourceTypeLabel"
                    :name="name"
                    :url="url"
                    :description="description"
                    :category="category"
                    :submitter-note="submitterNote"
                  />

                  <PublishSpecimenCard
                    :resource-type-label="resourceTypeLabel"
                    :name="name"
                    :url="url"
                    :category="category"
                    :description="description"
                  />
                </div>
              </section>
            </Transition>

            <div class="publish-actions">
              <button
                type="button"
                class="publish-btn publish-btn--ghost"
                :disabled="activeStep === 'source' || status === 'loading'"
                @click="goBack"
              >
                <ArrowLeft class="publish-btn__icon" aria-hidden="true" />
                Back
              </button>

              <span class="publish-actions__progress">{{ progressLabel }}</span>

              <button
                v-if="activeStep !== 'review'"
                type="button"
                class="publish-btn publish-btn--primary"
                :disabled="status === 'loading'"
                @click="goNext"
              >
                {{ nextButtonLabel }}
                <ArrowRight class="publish-btn__icon" aria-hidden="true" />
              </button>

              <button
                v-else
                type="submit"
                class="publish-btn publish-btn--primary"
                :disabled="status === 'loading'"
              >
                <Loader2
                  v-if="status === 'loading'"
                  class="publish-btn__icon animate-spin"
                  aria-hidden="true"
                />
                {{ status === 'loading' ? 'Submitting...' : nextButtonLabel }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
  Tokens are declared once on the page root and inherited by the rail, the ticket and
  the specimen card, so those components stay theme-agnostic. Dark is the default;
  the mocha palette takes over under html.light.
*/
.publish {
  --p-bg: #1a1a1a;
  --p-surface: #212121;
  --p-border: rgba(255, 255, 255, 0.08);
  --p-border-strong: rgba(255, 255, 255, 0.2);
  --p-text: #e8e8e8;
  --p-text-strong: #f4f4f4;
  --p-text-soft: rgba(255, 255, 255, 0.72);
  --p-text-muted: rgba(255, 255, 255, 0.56);
  --p-accent: #ff8c1a;
  --p-accent-wash: rgba(255, 140, 26, 0.1);
  --p-error: #f87171;
  --p-cta-bg: #e8e8e8;
  --p-cta-bg-hover: #ffffff;
  --p-cta-fg: #141414;
  --p-focus: #ff8c1a;

  min-height: 100%;
  background: var(--p-bg);
  color: var(--p-text);
}

:global(html.light .publish) {
  --p-bg: var(--mocha-bg);
  --p-surface: var(--mocha-surface);
  --p-border: var(--mocha-border);
  --p-border-strong: var(--mocha-border-strong);
  --p-text: var(--mocha-text);
  --p-text-strong: var(--mocha-text);
  /* Both levels are hand-picked: the mocha tokens land at 4.4:1 and 3.97:1 on this
     canvas, so soft and muted move darker to clear AA at their real sizes. */
  --p-text-soft: #52402f;
  --p-text-muted: #6b584a;
  /* #92400e holds 6.2:1 on the mocha canvas; the brand orange does not. */
  --p-accent: #92400e;
  --p-accent-wash: rgba(255, 140, 26, 0.14);
  --p-error: #b91c1c;
  --p-cta-bg: var(--mocha-text);
  --p-cta-bg-hover: #3d2d22;
  --p-cta-fg: var(--mocha-surface);
  --p-focus: #c2410c;
}

.publish__frame {
  width: min(100%, 1180px);
  margin-inline: auto;
  padding: 2rem 2rem 4rem;
}

.publish__masthead {
  display: grid;
  gap: 1.25rem;
  border-bottom: 1px solid var(--p-border);
  padding-bottom: 1.75rem;
}

.publish__title {
  margin: 0;
  color: var(--p-text-strong);
  font-size: clamp(1.9rem, 3.4vw, 2.65rem);
  font-weight: 700;
  letter-spacing: -0.035em;
  line-height: 1.05;
}

.publish__lede {
  max-width: 46ch;
  margin: 0.85rem 0 0;
  color: var(--p-text-soft);
  font-size: 0.95rem;
  line-height: 1.65;
}

.publish__aside {
  max-width: 30ch;
  margin: 0;
  color: var(--p-text-muted);
  font-size: 0.78rem;
  line-height: 1.6;
}

.publish__body {
  display: grid;
  gap: 2rem;
  padding-top: 1.75rem;
}

.publish__rail {
  display: grid;
  gap: 1.75rem;
  align-content: start;
}

.publish-note {
  border-left: 2px solid var(--p-border-strong);
  padding-left: 0.9rem;
}

.publish-note__title {
  margin: 0 0 0.3rem;
  color: var(--p-text-strong);
  font-size: 0.82rem;
  font-weight: 600;
}

.publish-note__body {
  margin: 0;
  color: var(--p-text-muted);
  font-size: 0.78rem;
  line-height: 1.65;
}

.publish-note__link {
  color: var(--p-accent);
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.publish-after__title {
  margin: 0 0 0.5rem;
  color: var(--p-text-soft);
  font-size: 0.78rem;
  font-weight: 600;
}

.publish-after__list {
  display: grid;
  gap: 0.4rem;
  margin: 0;
  padding-left: 1.1rem;
  color: var(--p-text-muted);
  font-size: 0.76rem;
  line-height: 1.6;
}

.publish-sheet {
  min-width: 0;
}

.publish-alert {
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  margin: 0 0 1.25rem;
  border-top: 1px solid var(--p-error);
  border-bottom: 1px solid var(--p-error);
  padding: 0.75rem 0;
  color: var(--p-error);
  font-size: 0.84rem;
  line-height: 1.6;
}

.publish-alert__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

/* Step header: the numeral is the identity motif, repeated from the rail. */
.publish-step__head {
  display: grid;
  grid-template-columns: 2.5rem minmax(0, 1fr);
  gap: 0.5rem;
  border-bottom: 1px solid var(--p-border);
  padding-bottom: 1.1rem;
}

.publish-step__num {
  padding-top: 0.55rem;
  color: var(--p-accent);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.publish-step__title {
  margin: 0;
  color: var(--p-text-strong);
  font-size: clamp(1.3rem, 2.2vw, 1.65rem);
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.publish-step__lede {
  max-width: 58ch;
  margin: 0.5rem 0 0;
  color: var(--p-text-muted);
  font-size: 0.86rem;
  line-height: 1.65;
}

.publish-kinds {
  margin: 1.5rem 0 0;
  border: 0;
  padding: 0;
}

.publish-kinds__legend {
  padding: 0;
  color: var(--p-text-muted);
  font-size: 0.78rem;
  font-weight: 500;
}

.publish-kind {
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  min-height: 3.5rem;
  margin-top: 0.5rem;
  border: 1px solid transparent;
  border-bottom-color: var(--p-border);
  padding: 0.95rem 0.75rem;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease;
}

.publish-kind:first-of-type {
  border-top-color: var(--p-border);
  margin-top: 0.9rem;
}

.publish-kind:hover {
  background: color-mix(in srgb, var(--p-text) 4%, transparent);
}

.publish-kind.is-selected {
  border-color: var(--p-accent);
  background: var(--p-accent-wash);
}

.publish-kind__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.publish-kind__mark {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 1rem;
  height: 1rem;
  margin-top: 0.15rem;
  border: 1px solid var(--p-border-strong);
  border-radius: 2px;
  transition: border-color 160ms ease;
}

.publish-kind__mark::after {
  content: '';
  width: 0.45rem;
  height: 0.45rem;
  background: var(--p-accent);
  opacity: 0;
  transition: opacity 140ms ease;
}

.publish-kind.is-selected .publish-kind__mark {
  border-color: var(--p-accent);
}

.publish-kind.is-selected .publish-kind__mark::after {
  opacity: 1;
}

.publish-kind__input:focus-visible + .publish-kind__mark {
  outline: 2px solid var(--p-focus);
  outline-offset: 3px;
}

.publish-kind__copy {
  display: grid;
  gap: 0.25rem;
  min-width: 0;
}

.publish-kind__label {
  color: var(--p-text-strong);
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.publish-kind__desc {
  color: var(--p-text-muted);
  font-size: 0.79rem;
  line-height: 1.55;
}

.publish-step__split {
  display: grid;
  gap: 2rem;
  margin-top: 1.5rem;
}

.publish-fields {
  min-width: 0;
}

/* A field row is a ledger line: label in the margin, control on the rule. */
.publish-field {
  display: grid;
  gap: 0.4rem;
  border-bottom: 1px solid var(--p-border);
  padding: 1.1rem 0;
}

.publish-fields .publish-field:first-child {
  border-top: 1px solid var(--p-border);
}

.publish-field__label {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  color: var(--p-text-soft);
  font-size: 0.82rem;
  font-weight: 600;
  letter-spacing: -0.005em;
  line-height: 1.5;
}

.publish-field__req {
  color: var(--p-text-muted);
  font-size: 0.71rem;
  font-weight: 400;
}

.publish-field__control {
  min-width: 0;
}

.publish-input {
  width: 100%;
  height: 2.75rem;
  border: 0;
  border-bottom: 1px solid var(--p-border-strong);
  border-radius: 0;
  background: transparent;
  padding: 0 0.15rem;
  color: var(--p-text-strong);
  font: inherit;
  font-size: 0.92rem;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.publish-input::placeholder {
  color: var(--p-text-muted);
  opacity: 1;
}

.publish-input:hover:not(:disabled) {
  border-bottom-color: var(--p-text-muted);
}

.publish-input:focus {
  border-bottom-color: var(--p-focus);
  box-shadow: 0 1px 0 0 var(--p-focus);
  outline: none;
}

/* The underline is the interaction cue; the ring is the keyboard affordance. */
.publish-input:focus-visible {
  outline: 2px solid var(--p-focus);
  outline-offset: 4px;
  border-radius: 2px;
}

.publish-input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.publish-input--area {
  height: auto;
  min-height: 5rem;
  padding: 0.55rem 0.15rem;
  resize: vertical;
  line-height: 1.65;
}

.publish-input--select {
  appearance: none;
  padding-right: 1.6rem;
  cursor: pointer;
}

.publish-input--select option {
  background: var(--p-surface);
  color: var(--p-text-strong);
}

.publish-select {
  position: relative;
}

.publish-select__chevron {
  position: absolute;
  top: 50%;
  right: 0.45rem;
  width: 0.45rem;
  height: 0.45rem;
  border-right: 1.5px solid var(--p-text-muted);
  border-bottom: 1.5px solid var(--p-text-muted);
  transform: translateY(-70%) rotate(45deg);
  pointer-events: none;
}

.publish-field__hint {
  margin: 0.4rem 0 0;
  color: var(--p-text-muted);
  font-size: 0.74rem;
  line-height: 1.6;
}

.publish-field__error {
  margin: 0.4rem 0 0;
  color: var(--p-error);
  font-size: 0.76rem;
  line-height: 1.6;
}

.publish-field.is-invalid .publish-input {
  border-bottom-color: var(--p-error);
  box-shadow: 0 1px 0 0 var(--p-error);
}

.publish-actions {
  position: sticky;
  bottom: 0;
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-top: 2.25rem;
  border-top: 1px solid var(--p-border);
  background: var(--p-bg);
  padding: 1rem 0;
}

.publish-actions__progress {
  color: var(--p-text-muted);
  font-size: 0.74rem;
  font-variant-numeric: tabular-nums;
}

.publish-btn {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  justify-content: center;
  height: 2.75rem;
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 0 1.1rem;
  font-size: 0.86rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    border-color 160ms ease,
    color 160ms ease,
    transform 120ms var(--ease-out-quint, ease-out);
}

.publish-btn:focus-visible {
  outline: 2px solid var(--p-focus);
  outline-offset: 2px;
}

.publish-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.publish-btn__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.publish-btn--primary {
  background: var(--p-cta-bg);
  color: var(--p-cta-fg);
}

.publish-btn--primary:hover:not(:disabled) {
  background: var(--p-cta-bg-hover);
}

.publish-btn--primary:active:not(:disabled) {
  transform: scale(0.985);
}

.publish-btn--ghost {
  border-color: var(--p-border-strong);
  background: transparent;
  color: var(--p-text-soft);
}

.publish-btn--ghost:hover:not(:disabled) {
  border-color: var(--p-text-muted);
  color: var(--p-text-strong);
}

/* Receipt: the ticket motif closing the loop after the queue accepts the item. */
.publish-receipt {
  margin-top: 1.75rem;
  border: 1px solid var(--p-border);
  border-radius: 10px;
  background: var(--p-surface);
}

.publish-receipt__head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px dashed var(--p-border-strong);
  padding: 1.1rem 1.25rem;
}

.publish-receipt__title {
  margin: 0;
  color: var(--p-text-strong);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.publish-receipt__status {
  border: 1px solid var(--p-border-strong);
  border-radius: 4px;
  padding: 0.15rem 0.45rem;
  color: var(--p-text-soft);
  font-size: 0.7rem;
  font-weight: 500;
}

.publish-receipt__rows {
  margin: 0;
  padding: 0.25rem 1.25rem 0.5rem;
}

.publish-receipt__row {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: 1rem;
  border-bottom: 1px solid var(--p-border);
  padding: 0.7rem 0;
}

.publish-receipt__row:last-child {
  border-bottom: 0;
}

.publish-receipt__row dt {
  color: var(--p-text-muted);
  font-size: 0.75rem;
  line-height: 1.6;
}

.publish-receipt__row dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--p-text);
  font-size: 0.85rem;
  line-height: 1.6;
}

.publish-receipt__link {
  display: inline-flex;
  align-items: center;
  /* Padding plus a matching negative margin: a 44px hit area without moving the text. */
  margin-block: -0.95rem;
  padding-block: 0.95rem;
  color: var(--p-accent);
  text-decoration: underline;
  text-underline-offset: 2px;
}

.publish-receipt__note {
  margin: 0;
  border-top: 1px dashed var(--p-border-strong);
  padding: 0.9rem 1.25rem;
  color: var(--p-text-muted);
  font-size: 0.78rem;
  line-height: 1.65;
}

.publish-receipt__actions {
  display: flex;
  border-top: 1px solid var(--p-border);
  padding: 1rem 1.25rem;
}

@media (min-width: 960px) {
  .publish__masthead {
    grid-template-columns: minmax(0, 1fr) 16rem;
    align-items: end;
    gap: 3rem;
  }

  .publish__aside {
    border-left: 1px solid var(--p-border);
    padding-left: 1.25rem;
  }

  .publish__body {
    grid-template-columns: 15.5rem minmax(0, 1fr);
    gap: 3rem;
    padding-top: 2rem;
  }

  .publish__rail {
    position: sticky;
    top: 1.5rem;
  }

  .publish-field {
    grid-template-columns: 10rem minmax(0, 1fr);
    gap: 0.4rem 1.5rem;
  }

  .publish-field__label {
    padding-top: 0.7rem;
  }
}

@media (min-width: 1280px) {
  .publish-step__split {
    grid-template-columns: minmax(0, 1fr) 17rem;
    gap: 2.5rem;
  }

  .publish-step__split--review {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  }
}

@media (max-width: 959px) {
  .publish__frame {
    padding: 1.5rem 1.25rem 3rem;
  }

  .publish__aside {
    display: none;
  }
}

@media (max-width: 640px) {
  .publish__frame {
    padding: 1.25rem 1rem 2.5rem;
  }

  .publish-step__head {
    grid-template-columns: 1.75rem minmax(0, 1fr);
  }

  .publish-actions {
    gap: 0.6rem;
  }

  .publish-actions__progress {
    display: none;
  }

  .publish-btn {
    flex: 1;
    padding: 0 0.75rem;
  }

  .publish-receipt__row {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
}

.publish-slide-forward-enter-active,
.publish-slide-forward-leave-active,
.publish-slide-back-enter-active,
.publish-slide-back-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms var(--ease-out-quint, cubic-bezier(0.23, 1, 0.32, 1));
}

.publish-slide-forward-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.publish-slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.publish-slide-back-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}

.publish-slide-back-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

@media (prefers-reduced-motion: reduce) {
  /* Cross-fade between steps instead of sliding them sideways. */
  .publish-slide-forward-enter-active,
  .publish-slide-forward-leave-active,
  .publish-slide-back-enter-active,
  .publish-slide-back-leave-active {
    transition: opacity 160ms ease;
  }

  .publish-slide-forward-enter-from,
  .publish-slide-forward-leave-to,
  .publish-slide-back-enter-from,
  .publish-slide-back-leave-to {
    transform: none;
  }

  .publish-btn,
  .publish-kind,
  .publish-rail__item,
  .publish-input {
    transition: none;
  }
}
</style>
