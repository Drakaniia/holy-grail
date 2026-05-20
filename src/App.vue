<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import HolyGrailFooter from './components/DailyFossFooter.vue'

const route = useRoute()
const isAuthRoute = computed(() => route.name === 'login' || route.name === 'signup')
</script>

<template>
  <RouterView v-if="isAuthRoute" />

  <div v-else class="h-screen flex bg-black text-white overflow-hidden">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Navbar />
      <main class="flex-1 min-h-0 overflow-y-auto">
        <div class="min-h-full flex flex-col">
          <div class="flex-1">
            <RouterView />
          </div>
          <HolyGrailFooter />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped></style>
