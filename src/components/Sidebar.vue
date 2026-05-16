<script setup lang="ts">
import { ref } from 'vue'
import { 
  Compass, 
  FileText, 
  Folder, 
  Store, 
  Users, 
  ChevronDown, 
  ChevronUp, 
  Library, 
  PenTool, 
  Sparkles, 
  Zap, 
  Rocket, 
  Target, 
  PlayCircle, 
  ShoppingCart, 
  Globe, 
  Code,
  PlusCircle
} from 'lucide-vue-next'

const activeItem = ref('Explore')
const expandedGroups = ref<Record<string, boolean>>({
  Tools: true,
  Libraries: false,
  Design: false,
  AI: false,
  'No-Code': false,
  Startups: false,
  Marketing: false,
  Video: false,
  'E-commerce': false,
  'Social Media': false,
  Coding: false
})

const toggleGroup = (group: string) => {
  expandedGroups.value[group] = !expandedGroups.value[group]
}

const mainNav = [
  { name: 'Explore', icon: Compass },
  { name: 'Articles', icon: FileText },
  { name: 'Collections', icon: Folder, hasDot: true },
  { name: 'Marketplace', icon: Store },
  { name: 'ogfolio', icon: Users },
]

const categories = [
  { name: 'Libraries', icon: Library },
  { name: 'Design', icon: PenTool },
  { name: 'AI', icon: Sparkles },
  { name: 'No-Code', icon: Zap },
  { name: 'Startups', icon: Rocket },
  { name: 'Marketing', icon: Target },
  { name: 'Video', icon: PlayCircle },
  { name: 'E-commerce', icon: ShoppingCart },
  { name: 'Social Media', icon: Globe },
  { name: 'Coding', icon: Code },
]
</script>

<template>
  <aside class="w-64 bg-black border-r border-gray-800 flex flex-col h-full overflow-y-auto custom-scrollbar select-none">
    <!-- Header/Logo Area (Optional if not in App.vue) -->
    <div class="p-4 border-b border-gray-800 flex items-center gap-2">
      <div class="flex items-center gap-1">
        <svg class="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
           <path d="M13 3L16.29 6.29L17.29 5.29L18.71 6.71L17.71 7.71L21 11V3H13ZM3 3V21H11V17.71L7.71L16.29 21L21 21V13H17.71L18.71 14.29L17.29 15.71L16.29 14.71L13 18V21H11V13L3 3ZM5 5L11 11V5H5Z" />
        </svg>
        <span class="font-bold text-xl tracking-tight text-white uppercase">Toolfolio</span>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="flex-1 py-4">
      <ul class="space-y-1 px-2">
        <li v-for="item in mainNav" :key="item.name">
          <button 
            @click="activeItem = item.name"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors group relative"
            :class="activeItem === item.name ? 'bg-zinc-900 text-white' : 'text-gray-400 hover:text-white hover:bg-zinc-900/50'"
          >
            <!-- Active Indicator (vertical line) -->
            <div 
              v-if="activeItem === item.name" 
              class="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-white"
            ></div>
            
            <component :is="item.icon" class="w-5 h-5" />
            <span class="font-medium text-sm">{{ item.name }}</span>
            
            <div v-if="item.hasDot" class="ml-auto w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          </button>
        </li>
      </ul>

      <!-- Tools Section -->
      <div class="mt-6 px-4">
        <button 
          @click="toggleGroup('Tools')"
          class="w-full flex items-center justify-between text-gray-500 hover:text-gray-300 transition-colors py-2"
        >
          <span class="text-xs font-semibold uppercase tracking-wider">Tools</span>
          <component :is="expandedGroups['Tools'] ? ChevronUp : ChevronDown" class="w-4 h-4" />
        </button>
        
        <ul v-if="expandedGroups['Tools']" class="mt-2 space-y-1">
          <li v-for="cat in categories" :key="cat.name">
            <button 
              @click="toggleGroup(cat.name)"
              class="w-full flex items-center gap-3 px-2 py-2 rounded-md text-gray-400 hover:text-white hover:bg-zinc-900/50 transition-colors group"
            >
              <component :is="cat.icon" class="w-5 h-5" />
              <span class="font-medium text-sm flex-1 text-left">{{ cat.name }}</span>
              <ChevronDown class="w-4 h-4 text-gray-600 group-hover:text-gray-400" />
            </button>
          </li>
        </ul>
      </div>
    </nav>

    <!-- Footer Action -->
    <div class="p-4 border-t border-gray-800">
      <button class="w-full flex items-center gap-3 px-3 py-2 text-gray-400 hover:text-white transition-colors group">
        <div class="relative">
           <PlusCircle class="w-5 h-5" />
           <div class="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border border-black"></div>
        </div>
        <span class="font-medium text-sm">Submit a Tool</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #1f2937;
  border-radius: 10px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #374151;
}
</style>
