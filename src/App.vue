<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Navbar from './components/Navbar.vue'
import Sidebar from './components/Sidebar.vue'
import HolyGrailFooter from './components/DailyFossFooter.vue'

const showFooter = ref(false)
const mainRef = ref<HTMLElement | null>(null)

const handleScroll = () => {
  if (mainRef.value) {
    const { scrollTop, scrollHeight, clientHeight } = mainRef.value
    showFooter.value = scrollTop + clientHeight >= scrollHeight - 10
  }
}

onMounted(() => {
  mainRef.value?.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  mainRef.value?.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="h-screen flex bg-black text-white overflow-hidden">
    <Sidebar />
    <div class="flex-1 flex flex-col overflow-hidden">
      <Navbar />
      <main ref="mainRef" class="flex-grow flex items-center justify-center p-8 overflow-y-auto">
        <div class="text-center">
          <h1 class="text-4xl font-bold mb-4">You did it!</h1>
          <p class="text-gray-400">
            Visit
            <a
              href="https://vuejs.org/"
              target="_blank"
              rel="noopener"
              class="text-blue-400 hover:underline"
              >vuejs.org</a
            >
            to read the documentation
          </p>
        </div>
      </main>
      <HolyGrailFooter v-if="showFooter" />
    </div>
  </div>
</template>

<style scoped></style>
