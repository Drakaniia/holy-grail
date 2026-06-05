<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'

const { isLightMode } = useTheme()
</script>

<template>
  <footer class="site-footer" :class="{ 'site-footer--light': isLightMode }">
    <div class="site-footer__inner">
      <p class="site-footer__credit">
        &copy; 2026 Holy Grail. Made with
        <span class="site-footer__heart" aria-label="orange heart">&#129505;</span>
        by
        <a href="https://github.com/Drakaniia" target="_blank" rel="noreferrer">Drakaniia</a>.
      </p>

      <nav class="site-footer__nav" aria-label="Footer navigation">
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/changelog">Changelog</RouterLink>
        <RouterLink to="/docs">Docs</RouterLink>
        <RouterLink to="/publish">Publish</RouterLink>
        <a href="https://github.com/Drakaniia/holy-grail" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  flex-shrink: 0;
  border-top: 1px solid var(--footer-border, #1f1f1f);
  background: var(--footer-bg, #1f1f1f);
  color: var(--footer-muted, #8d8d8d);
}

.site-footer__inner {
  display: flex;
  width: min(100%, 70rem);
  min-height: 6.5rem;
  margin: 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.4rem 1.5rem;
}

.site-footer__credit {
  margin: 0;
  color: var(--footer-muted, #8d8d8d);
  font-size: 0.83rem;
  line-height: 1.6;
}

.site-footer__heart {
  color: #ff8a1f;
}

.site-footer__credit a,
.site-footer__nav a {
  color: var(--footer-link, #f4f4f4);
  transition:
    color 160ms ease,
    opacity 160ms ease;
}

.site-footer__credit a:hover,
.site-footer__nav a:hover {
  color: #ff8a1f;
}

.site-footer__nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 1.4rem;
  font-size: 0.83rem;
  font-weight: 600;
}

.site-footer--light {
  --footer-bg: var(--mocha-bg);
  --footer-border: var(--mocha-border);
  --footer-muted: var(--mocha-muted);
  --footer-link: var(--mocha-text);
}

@media (max-width: 720px) {
  .site-footer__inner {
    align-items: flex-start;
    flex-direction: column;
  }

  .site-footer__nav {
    justify-content: flex-start;
    gap: 1rem;
  }
}
</style>
