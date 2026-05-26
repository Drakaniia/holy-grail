<script setup lang="ts">
import { onMounted, shallowRef } from 'vue'
import { Menu, Moon, SunMedium, UserRound, X } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/composables/useTheme'

const auth = useAuthStore()
const { isLightMode, themeToggleLabel, toggleTheme } = useTheme()
const isMenuOpen = shallowRef(false)

const navItems = [
  { label: 'Sites', to: '/sites/development/cloud-hosting' },
  { label: 'Skills', to: '/skills/skills' },
  { label: 'Publish', to: '/publish' },
]

function closeMenu() {
  isMenuOpen.value = false
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

onMounted(() => {
  void auth.initialize()
})
</script>

<template>
  <header class="home-navbar">
    <RouterLink to="/" class="home-navbar__brand" aria-label="Holy Grail home" @click="closeMenu">
      <svg class="home-navbar__mark" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71 21H3ZM5 5L11 11V5H5ZM13 13V18L16.29 14.71L17.29 15.71L18.71 14.29L17.71 13.29L21 10V21H13V13Z"
        />
      </svg>
      <span>Holy Grail</span>
    </RouterLink>

    <nav class="home-navbar__links" aria-label="Landing navigation">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="home-navbar__link"
      >
        {{ item.label }}
      </RouterLink>
    </nav>

    <div class="home-navbar__actions">
      <button
        type="button"
        class="home-navbar__icon-button"
        :aria-label="themeToggleLabel"
        :title="themeToggleLabel"
        @click="toggleTheme"
      >
        <component :is="isLightMode ? SunMedium : Moon" class="h-4 w-4" aria-hidden="true" />
      </button>

      <RouterLink
        :to="auth.isAuthenticated ? '/account' : '/login'"
        class="home-navbar__account"
      >
        <UserRound class="h-4 w-4" aria-hidden="true" />
        <span>{{ auth.isAuthenticated ? 'Account' : 'Sign In' }}</span>
      </RouterLink>

      <button
        type="button"
        class="home-navbar__menu-button"
        :aria-expanded="isMenuOpen"
        aria-controls="home-mobile-nav"
        :aria-label="isMenuOpen ? 'Close landing navigation' : 'Open landing navigation'"
        @click="toggleMenu"
      >
        <component :is="isMenuOpen ? X : Menu" class="h-5 w-5" aria-hidden="true" />
      </button>
    </div>

    <Transition name="home-menu">
      <nav v-if="isMenuOpen" id="home-mobile-nav" class="home-navbar__mobile" aria-label="Mobile landing navigation">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="home-navbar__mobile-link"
          @click="closeMenu"
        >
          {{ item.label }}
        </RouterLink>
        <RouterLink
          :to="auth.isAuthenticated ? '/account' : '/login'"
          class="home-navbar__mobile-link home-navbar__mobile-link--strong"
          @click="closeMenu"
        >
          {{ auth.isAuthenticated ? 'Account' : 'Sign In' }}
        </RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.home-navbar {
  position: sticky;
  top: 0;
  z-index: 60;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  min-height: 4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(5, 5, 5, 0.94);
  padding: 0 1rem;
  color: #ffffff;
}

.home-navbar__brand,
.home-navbar__links,
.home-navbar__actions,
.home-navbar__account,
.home-navbar__icon-button,
.home-navbar__menu-button {
  display: flex;
  align-items: center;
}

.home-navbar__brand {
  min-width: 0;
  gap: 0.55rem;
  color: #ffffff;
  font-size: 0.92rem;
  font-weight: 900;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.home-navbar__mark {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
}

.home-navbar__links {
  gap: 1px;
  border-inline: 1px solid rgba(255, 255, 255, 0.13);
  background: rgba(255, 255, 255, 0.13);
}

.home-navbar__link {
  min-width: 8rem;
  background: #050505;
  padding: 1.45rem 1.1rem;
  color: #a8a8a8;
  text-align: center;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  transition:
    background-color 160ms ease,
    color 160ms ease;
}

.home-navbar__link:hover {
  background: rgba(255, 122, 0, 0.14);
  color: #ffffff;
}

.home-navbar__actions {
  justify-content: flex-end;
  gap: 0.6rem;
}

.home-navbar__icon-button,
.home-navbar__menu-button {
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: #050505;
  color: #d6d6d6;
  transition:
    border-color 160ms ease,
    background-color 160ms ease,
    color 160ms ease;
}

.home-navbar__icon-button:hover,
.home-navbar__menu-button:hover {
  border-color: rgba(255, 122, 0, 0.8);
  color: #ffffff;
}

.home-navbar__account {
  min-height: 2.4rem;
  gap: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0 0.85rem;
  color: #ffffff;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  transition:
    border-color 160ms ease,
    background-color 160ms ease;
}

.home-navbar__account:hover {
  border-color: #ff7a00;
  background: rgba(255, 122, 0, 0.12);
}

.home-navbar__menu-button,
.home-navbar__mobile {
  display: none;
}

.home-navbar__mobile {
  grid-column: 1 / -1;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  padding: 0.75rem 0 1rem;
}

.home-navbar__mobile-link {
  display: flex;
  align-items: center;
  min-height: 3rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  color: #d6d6d6;
  font-size: 0.82rem;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.home-navbar__mobile-link--strong {
  color: #ff9b3d;
}

:global(html.light .home-navbar) {
  border-bottom-color: var(--mocha-border);
  background: rgba(255, 250, 243, 0.95);
  color: var(--mocha-text);
}

:global(html.light .home-navbar__brand),
:global(html.light .home-navbar__account) {
  color: var(--mocha-text);
}

:global(html.light .home-navbar__links) {
  border-color: var(--mocha-border);
  background: var(--mocha-border);
}

:global(html.light .home-navbar__link),
:global(html.light .home-navbar__icon-button),
:global(html.light .home-navbar__menu-button) {
  border-color: var(--mocha-border);
  background: var(--mocha-surface);
  color: var(--mocha-muted);
}

:global(html.light .home-navbar__link:hover),
:global(html.light .home-navbar__icon-button:hover),
:global(html.light .home-navbar__menu-button:hover),
:global(html.light .home-navbar__account:hover) {
  color: var(--mocha-text);
  background: rgba(255, 122, 0, 0.12);
}

:global(html.light .home-navbar__account),
:global(html.light .home-navbar__mobile),
:global(html.light .home-navbar__mobile-link) {
  border-color: var(--mocha-border);
}

:global(html.light .home-navbar__mobile-link) {
  color: var(--mocha-text-soft);
}

@media (max-width: 820px) {
  .home-navbar {
    grid-template-columns: 1fr auto;
  }

  .home-navbar__links,
  .home-navbar__account {
    display: none;
  }

  .home-navbar__menu-button {
    display: flex;
  }

  .home-navbar__mobile {
    display: grid;
  }
}

.home-menu-enter-active,
.home-menu-leave-active {
  transition:
    opacity 160ms ease,
    transform 160ms ease;
}

.home-menu-enter-from,
.home-menu-leave-to {
  opacity: 0;
  transform: translateY(-0.35rem);
}

@media (prefers-reduced-motion: reduce) {
  .home-navbar__link,
  .home-navbar__icon-button,
  .home-navbar__menu-button,
  .home-navbar__account,
  .home-menu-enter-active,
  .home-menu-leave-active {
    transition: none;
  }
}
</style>
