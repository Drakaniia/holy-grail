<script setup lang="ts">
import { Search, TrendingUp, Clock, Star, Sparkles } from 'lucide-vue-next'
import { useSitesStore } from '@/stores/sites'
import SiteCard from '@/components/sites/SiteCard.vue'

const store = useSitesStore()
</script>

<template>
  <div class="min-h-screen bg-black text-white">
    <!-- Header Section -->
    <div class="border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div class="flex-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
              DAILY FOSS
            </p>
            <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              Useful open-source sites<br />and tools for developers
            </h1>
            <p class="text-gray-400 text-base leading-relaxed max-w-2xl">
              A curated collection of self-hosted, open-source software and tools. Discover backend platforms, dashboards, automation workflows, and more for your development stack.
            </p>
          </div>

          <div class="flex-shrink-0">
            <div class="border border-gray-800 rounded-xl px-6 py-5 min-w-[200px]" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                COLLECTION
              </p>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-3xl font-bold text-white">{{ store.allSites.length }}</span>
                <span class="text-sm text-gray-500">sites</span>
              </div>
              <div class="flex items-center gap-1.5 text-gray-500 text-xs">
                <Sparkles class="w-3 h-3 text-yellow-500" />
                <span>Updated May 16, 2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="max-w-7xl mx-auto px-6 py-6">
      <!-- Search and Filter Bar -->
      <div class="border border-gray-800 rounded-xl p-4 mb-6" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Search Input -->
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              v-model="store.searchQuery"
              @input="store.setSearchQuery(store.searchQuery)"
              type="text"
              placeholder="Search sites by name or category"
              class="w-full bg-black border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <!-- Filter Tabs -->
          <div class="flex items-center gap-1 border border-gray-700 rounded-lg p-1" style="background: linear-gradient(to right, #000000 0%, #000000 100%)">
            <button
              @click="store.setTab('trending')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'trending' ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <TrendingUp class="w-3.5 h-3.5" />
              TRENDING
            </button>
            <button
              @click="store.setTab('newest')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'newest' ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <Clock class="w-3.5 h-3.5" />
              NEWEST
            </button>
            <button
              @click="store.setTab('popular')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'popular' ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <Star class="w-3.5 h-3.5" />
              POPULAR
            </button>
          </div>

          <!-- Right Side: Count -->
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">
              Showing {{ store.filteredSites.length }} of {{ store.allSites.length }} sites
            </span>
          </div>
        </div>

        <!-- Category Filters -->
        <div class="flex flex-wrap gap-2 mt-4">
          <button
            v-for="category in store.categories"
            :key="category"
            @click="store.setCategory(category)"
            class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              :class="store.activeCategory === category
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white border border-gray-700'"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Sites Grid -->
      <div v-if="store.paginatedSites.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SiteCard
          v-for="site in store.paginatedSites"
          :key="site.slug"
          :site="site"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <p class="text-gray-500 text-lg">No sites found matching your search.</p>
        <button
          @click="store.setSearchQuery(''); store.setCategory('All')"
          class="mt-4 text-blue-400 hover:text-blue-300 text-sm"
        >
          Clear filters
        </button>
      </div>

      <!-- Pagination -->
      <div v-if="store.totalPages > 1" class="flex items-center justify-center gap-2 mt-8">
        <button
          @click="store.setPage(store.currentPage - 1)"
          :disabled="store.currentPage === 1"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
          style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
        >
          Previous
        </button>

        <template v-for="page in store.totalPages" :key="page">
          <button
            v-if="page === 1 || page === store.totalPages || Math.abs(page - store.currentPage) <= 1"
            @click="store.setPage(page)"
            class="w-10 h-10 rounded-lg text-sm font-medium transition-all"
            :class="store.currentPage === page
              ? 'bg-blue-600 text-white'
              : 'border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'"
          style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
          >
            {{ page }}
          </button>
          <span
            v-else-if="Math.abs(page - store.currentPage) === 2"
            class="text-gray-600"
          >
            ...
          </span>
        </template>

        <button
          @click="store.setPage(store.currentPage + 1)"
          :disabled="store.currentPage === store.totalPages"
          class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
          style="background: linear-gradient(to right, #000000 0%, #000000 100%)"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
