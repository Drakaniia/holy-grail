<script setup lang="ts">
import { Search, TrendingUp, Clock, Plus, Sparkles } from 'lucide-vue-next'
import { useSkillsStore } from '@/stores/skills'
import SkillCard from '@/components/skills/SkillCard.vue'

const store = useSkillsStore()
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white">
    <!-- Header Section -->
    <div class="border-b border-gray-800">
      <div class="max-w-7xl mx-auto px-6 py-12">
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div class="flex-1">
            <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-3">
              AURA SKILLS
            </p>
            <h1 class="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
              AI agent skills for front-end<br />teams and web designers
            </h1>
            <p class="text-gray-400 text-base leading-relaxed max-w-2xl">
              A curated library of reusable skills, automation templates, and instructions tailored to front-end teams, web designers, and creative developers. Use agent skills in Aura by referencing @ in your prompt.
            </p>
          </div>

          <div class="flex-shrink-0">
            <div class="bg-[#111111] border border-gray-800 rounded-xl px-6 py-5 min-w-[200px]">
              <p class="text-xs font-medium text-gray-500 uppercase tracking-widest mb-2">
                LIBRARY PULSE
              </p>
              <div class="flex items-baseline gap-2 mb-2">
                <span class="text-3xl font-bold text-white">{{ store.allSkills.length }}</span>
                <span class="text-sm text-gray-500">skills</span>
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
    <div class="max-w-7xl mx-auto px-6 py-8">
      <!-- Search and Filter Bar -->
      <div class="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <!-- Search Input -->
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              v-model="store.searchQuery"
              @input="store.setSearchQuery(store.searchQuery)"
              type="text"
              placeholder="Search skills by name or intent"
              class="w-full bg-[#111111] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <!-- Filter Tabs -->
          <div class="flex items-center gap-1 bg-[#111111] border border-gray-700 rounded-lg p-1">
            <button
              @click="store.setTab('popular')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'popular' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <TrendingUp class="w-3.5 h-3.5" />
              POPULAR
            </button>
            <button
              @click="store.setTab('trending')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'trending' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <TrendingUp class="w-3.5 h-3.5" />
              TRENDING
            </button>
            <button
              @click="store.setTab('recent')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="store.activeTab === 'recent' ? 'bg-[#2a2a2a] text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              <Clock class="w-3.5 h-3.5" />
              RECENT
            </button>
          </div>

          <!-- Right Side: Count and Add Button -->
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-500">
              Showing {{ store.filteredSkills.length }} of {{ store.allSkills.length }} skills
            </span>
            <button
              class="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus class="w-4 h-4" />
              Add Skill
            </button>
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
              : 'bg-[#111111] text-gray-400 hover:text-white border border-gray-700'"
          >
            {{ category }}
          </button>
        </div>
      </div>

      <!-- Skills Grid -->
      <div v-if="store.paginatedSkills.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <SkillCard
          v-for="skill in store.paginatedSkills"
          :key="skill.slug"
          :skill="skill"
        />
      </div>

      <!-- Empty State -->
      <div v-else class="text-center py-16">
        <p class="text-gray-500 text-lg">No skills found matching your search.</p>
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
          class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
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
              : 'bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'"
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
          class="px-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#1a1a1a] border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>
