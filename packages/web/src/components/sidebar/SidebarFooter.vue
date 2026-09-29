<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue'
import { CircleHelp, Home, LogIn, Send, ShieldCheck } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import UserAvatar from '@/components/auth/UserAvatar.vue'
import { useAuthDialog } from '@/composables/useAuthDialog'
import { useDeferredAuthStatus } from '@/composables/useDeferredAuthStatus'
import SidebarIconButton from './SidebarIconButton.vue'
import SidebarPromoCard from './SidebarPromoCard.vue'

const PROMO_DISMISSED_STORAGE_KEY = 'holy-grail-sidebar-promo-dismissed'
/**
 * Height of the floating promo card, published on this sidebar's root element so the scroll panels
 * can reserve exactly that much room and never hide their last rows behind the card.
 * Scoped per `.app-sidebar` instance, so the mobile drawer's own footer cannot clobber the docked one.
 */
const PROMO_HEIGHT_VAR = '--sidebar-promo-height'

const props = withDefaults(
  defineProps<{
    isAdmin?: boolean
    pendingAdminCount?: number
  }>(),
  {
    isAdmin: false,
    pendingAdminCount: 0,
  },
)

const { auth, isAuthenticated } = useDeferredAuthStatus()
const { openAuthDialog } = useAuthDialog()
const isPromoDismissed = shallowRef(false)
const promoCard = useTemplateRef<HTMLElement>('promoCard')
let promoObserver: ResizeObserver | undefined
/** Kept across dismissals: the card unmounts, but its host is where the reserved height lives. */
let promoHost: HTMLElement | null = null

function applyPromoHeight(height: number) {
  promoHost?.style.setProperty(PROMO_HEIGHT_VAR, `${Math.max(0, Math.round(height))}px`)
}

watch(
  () => [promoCard.value, isPromoDismissed.value] as const,
  ([card]) => {
    promoObserver?.disconnect()
    promoObserver = undefined

    if (!card) {
      // Dismissed (or unmounted): release the reservation so the list reclaims the space.
      applyPromoHeight(0)
      return
    }

    promoHost = card.closest<HTMLElement>('.app-sidebar')
    // Border-box height: `contentRect` would drop the card's border and padding.
    applyPromoHeight(card.getBoundingClientRect().height)
    promoObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) applyPromoHeight(entry.target.getBoundingClientRect().height)
    })
    promoObserver.observe(card)
  },
  { flush: 'post' },
)

onUnmounted(() => {
  promoObserver?.disconnect()
  promoObserver = undefined
  applyPromoHeight(0)
})

onMounted(() => {
  try {
    isPromoDismissed.value = window.localStorage.getItem(PROMO_DISMISSED_STORAGE_KEY) === 'true'
  } catch {
    isPromoDismissed.value = false
  }
})

function dismissPromo() {
  isPromoDismissed.value = true

  try {
    window.localStorage.setItem(PROMO_DISMISSED_STORAGE_KEY, 'true')
  } catch {}
}
</script>

<style scoped>
.sidebar-pill-enter-active,
.sidebar-pill-leave-active {
  transition:
    transform 500ms ease-out,
    opacity 500ms ease-out;
}

.sidebar-pill-enter-from,
.sidebar-pill-leave-to {
  opacity: 0;
  transform: translateY(0.25rem);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-pill-enter-active,
  .sidebar-pill-leave-active {
    transition: none;
  }
}
</style>

<template>
  <div class="relative shrink-0 bg-sidebar px-2 pb-2">
    <!-- Pinned to the top edge of the footer strip: it floats over the list, never over the row. -->
    <div
      v-if="!isPromoDismissed"
      ref="promoCard"
      class="absolute inset-x-2 bottom-full z-20 mb-2 hidden md:block"
    >
      <SidebarPromoCard @dismiss="dismissPromo" />
    </div>

    <div class="flex h-9 items-center gap-0.5">
      <SidebarIconButton to="/" label="Home" :icon="Home" />
      <SidebarIconButton to="/publish" label="Publish" :icon="Send" />
      <SidebarIconButton
        v-if="props.isAdmin"
        to="/admin"
        label="Admin"
        :icon="ShieldCheck"
        :badge="props.pendingAdminCount"
      />
      <SidebarIconButton to="/docs" label="Help" :icon="CircleHelp" />

      <div class="flex-1"></div>

      <Transition name="sidebar-pill" mode="out-in">
        <RouterLink
          v-if="isAuthenticated"
          key="account"
          to="/account"
          class="inline-flex h-8 min-w-0 max-w-[9rem] items-center gap-2 rounded-full bg-sidebar-raised pr-2.5 pl-1 text-xs font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60"
          aria-label="Open your account"
        >
          <UserAvatar
            :src="auth?.avatarUrl"
            :initial="auth?.avatarInitial ?? '?'"
            :label="auth?.displayName ?? 'Account'"
            shape="circle"
            size="sm"
          />
          <span class="truncate">{{ auth?.displayName ?? 'Account' }}</span>
        </RouterLink>

        <button
          v-else
          key="signin"
          type="button"
          class="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-sidebar-raised px-2.5 text-xs font-medium text-sidebar-foreground transition-[background-color,transform] duration-150 hover:bg-sidebar-hover focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-sidebar-ring/60 active:scale-[0.97] motion-reduce:transition-none motion-reduce:active:scale-100"
          @click="openAuthDialog('login')"
        >
          <LogIn class="h-3.5 w-3.5" />
          <span>Sign in</span>
        </button>
      </Transition>
    </div>
  </div>
</template>
