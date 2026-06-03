<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import ohSnapImage from '@/assets/oh-snap.png'

const router = useRouter()

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }

  void router.push('/')
}
</script>

<template>
  <main class="not-found-page" aria-labelledby="not-found-title">
    <div class="not-found-page__content">
      <img
        class="not-found-page__art"
        :src="ohSnapImage"
        alt="Disconnected plug illustration"
        decoding="async"
      />

      <p class="not-found-page__eyebrow">404</p>
      <h1 id="not-found-title" class="not-found-page__title">
        This page doesn't exist
      </h1>
      <p class="not-found-page__message">
        Oops... this page seems to have wandered off.<br />
        It might have been moved, renamed, or decided to take a vacation.
      </p>

      <div class="not-found-page__actions" aria-label="Page recovery actions">
        <RouterLink class="not-found-page__button not-found-page__button--primary" to="/">
          Back home
        </RouterLink>
        <button
          type="button"
          class="not-found-page__button not-found-page__button--secondary"
          @click="goBack"
        >
          <ArrowLeft class="not-found-page__button-icon" aria-hidden="true" />
          Go back
        </button>
      </div>
    </div>
  </main>
</template>

<style scoped>
.not-found-page {
  display: grid;
  min-height: 100dvh;
  place-items: center;
  overflow: hidden;
  background:
    radial-gradient(circle at 50% 24%, rgba(44, 98, 255, 0.1), transparent 21rem),
    #050505;
  color: #ffffff;
  color-scheme: dark;
  padding: 2rem 1rem;
}

.not-found-page__content {
  width: min(100%, 48rem);
  text-align: center;
}

.not-found-page__art {
  width: clamp(8.5rem, 21vw, 15rem);
  max-width: 100%;
  height: auto;
  margin: 0 auto 3rem;
  user-select: none;
}

.not-found-page__eyebrow {
  margin: 0 0 0.65rem;
  color: #8f9aab;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.not-found-page__title {
  margin: 0;
  color: #f7f7f7;
  font-size: clamp(2.6rem, 6.4vw, 4.65rem);
  font-weight: 720;
  letter-spacing: 0;
  line-height: 0.98;
}

.not-found-page__message {
  margin: 1.2rem auto 0;
  max-width: 42rem;
  color: #a7a7a7;
  font-size: clamp(1rem, 2.1vw, 1.1rem);
  font-weight: 500;
  line-height: 1.65;
}

.not-found-page__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.15rem;
}

.not-found-page__button {
  display: inline-flex;
  min-height: 2rem;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  border-radius: 0.55rem;
  padding: 0 0.8rem;
  font-size: 0.86rem;
  font-weight: 700;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.not-found-page__button:hover {
  transform: translateY(-1px);
}

.not-found-page__button:focus-visible {
  outline: 2px solid #71b8ff;
  outline-offset: 3px;
}

.not-found-page__button--primary {
  border: 1px solid #f1f1f1;
  background: #f1f1f1;
  color: #171717;
}

.not-found-page__button--primary:hover {
  border-color: #ffffff;
  background: #ffffff;
}

.not-found-page__button--secondary {
  border: 1px solid #303030;
  background: #0b0b0b;
  color: #f3f3f3;
}

.not-found-page__button--secondary:hover {
  border-color: #515151;
  background: #151515;
}

.not-found-page__button-icon {
  width: 0.95rem;
  height: 0.95rem;
}

@media (max-width: 640px) {
  .not-found-page {
    padding: 2.5rem 1.1rem;
  }

  .not-found-page__art {
    margin-bottom: 2.3rem;
  }

  .not-found-page__message {
    line-height: 1.55;
  }
}

@media (prefers-reduced-motion: reduce) {
  .not-found-page__button {
    transition: none;
  }

  .not-found-page__button:hover {
    transform: none;
  }
}
</style>
