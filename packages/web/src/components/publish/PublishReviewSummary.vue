<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'

const props = defineProps<{
  resourceTypeLabel: string
  name: string
  url: string
  description: string
  category: string
  submitterNote: string
}>()
</script>

<template>
  <section class="ticket" aria-labelledby="publish-ticket-title">
    <header class="ticket__head">
      <h3 id="publish-ticket-title" class="ticket__title">Submission ticket</h3>
      <span class="ticket__status">Pending review</span>
    </header>

    <dl class="ticket__rows">
      <div class="ticket__row">
        <dt>Type</dt>
        <dd>{{ props.resourceTypeLabel }}</dd>
      </div>
      <div class="ticket__row">
        <dt>Name</dt>
        <dd>{{ props.name.trim() }}</dd>
      </div>
      <div class="ticket__row">
        <dt>Source</dt>
        <dd>
          <a :href="props.url" target="_blank" rel="noopener noreferrer" class="ticket__link">
            {{ props.url }}
            <ExternalLink class="ticket__link-icon" aria-hidden="true" />
          </a>
        </dd>
      </div>
      <div class="ticket__row">
        <dt>Category</dt>
        <dd>{{ props.category }}</dd>
      </div>
      <div class="ticket__row">
        <dt>Description</dt>
        <dd>{{ props.description.trim() }}</dd>
      </div>
      <div class="ticket__row">
        <dt>Reviewer note</dt>
        <dd>{{ props.submitterNote.trim() || 'No extra note' }}</dd>
      </div>
    </dl>

    <p class="ticket__foot">
      An admin checks fit, quality, duplication, and safety. Queued items stay out of the public
      catalog until they are approved.
    </p>
  </section>
</template>

<style scoped>
/*
  The ticket is the one printed artifact on an otherwise rule-only page: a bordered
  surface with a dashed tear line separating the header and the footer note, so it
  reads as the thing the reviewer receives rather than another form card.
*/
.ticket {
  overflow: hidden;
  border: 1px solid var(--p-border, rgba(255, 255, 255, 0.08));
  border-radius: 10px;
  background: var(--p-surface, #212121);
}

.ticket__head {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: baseline;
  justify-content: space-between;
  border-bottom: 1px dashed var(--p-border-strong, rgba(255, 255, 255, 0.2));
  padding: 1rem 1.25rem;
}

.ticket__title {
  margin: 0;
  color: var(--p-text-strong, #f4f4f4);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.ticket__status {
  border: 1px solid var(--p-border-strong, rgba(255, 255, 255, 0.2));
  border-radius: 4px;
  padding: 0.15rem 0.45rem;
  color: var(--p-text-soft, rgba(255, 255, 255, 0.72));
  font-size: 0.7rem;
  font-weight: 500;
}

.ticket__rows {
  margin: 0;
  padding: 0.25rem 1.25rem 0.5rem;
}

.ticket__row {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: 1rem;
  border-bottom: 1px solid var(--p-border, rgba(255, 255, 255, 0.08));
  padding: 0.7rem 0;
}

.ticket__row:last-child {
  border-bottom: 0;
}

.ticket__row dt {
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.75rem;
  font-weight: 500;
  line-height: 1.6;
}

.ticket__row dd {
  margin: 0;
  overflow-wrap: anywhere;
  color: var(--p-text, #e8e8e8);
  font-size: 0.85rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.ticket__link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  /* Padding plus a matching negative margin: a 44px hit area without moving the text. */
  margin-block: -0.95rem;
  padding-block: 0.95rem;
  color: var(--p-accent, #ff8c1a);
  text-decoration: underline;
  text-decoration-color: color-mix(in srgb, var(--p-accent, #ff8c1a) 40%, transparent);
  text-underline-offset: 2px;
}

.ticket__link:hover {
  text-decoration-color: currentColor;
}

.ticket__link-icon {
  width: 0.8rem;
  height: 0.8rem;
  flex-shrink: 0;
}

.ticket__foot {
  margin: 0;
  border-top: 1px dashed var(--p-border-strong, rgba(255, 255, 255, 0.2));
  padding: 0.85rem 1.25rem;
  color: var(--p-text-muted, rgba(255, 255, 255, 0.56));
  font-size: 0.75rem;
  line-height: 1.6;
}

@media (max-width: 560px) {
  .ticket__row {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
}
</style>
