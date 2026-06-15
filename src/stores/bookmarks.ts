import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { trackBookmark } from '@/lib/analytics'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

export type BookmarkResourceType = 'site' | 'skill'

export interface BookmarkResource {
  type: BookmarkResourceType
  slug: string
  title: string
  url?: string | null
  category?: string | null
}

export interface UserBookmark {
  id: string
  user_id: string
  resource_type: BookmarkResourceType
  resource_slug: string
  title: string
  url: string | null
  category: string | null
  created_at: string
}

interface BookmarkActionResult {
  ok: boolean
  message?: string
  requiresAuth?: boolean
}

const BOOKMARK_COLUMNS = 'id,user_id,resource_type,resource_slug,title,url,category,created_at'
const SUPABASE_CONFIG_ERROR = 'Supabase is not configured for bookmarks yet.'

function getBookmarkKey(type: BookmarkResourceType, slug: string) {
  return `${type}:${slug}`
}

function getBookmarkErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) {
      return message
    }
  }

  return 'Bookmark request failed.'
}

export const useBookmarksStore = defineStore('bookmarks', () => {
  const bookmarks = ref<UserBookmark[]>([])
  const loading = shallowRef(false)
  const initializedForUser = shallowRef<string | null>(null)
  const actionError = shallowRef<string | null>(null)

  const bookmarkKeys = computed(
    () =>
      new Set(
        bookmarks.value.map((bookmark) =>
          getBookmarkKey(bookmark.resource_type, bookmark.resource_slug),
        ),
      ),
  )
  const bookmarkCount = computed(() => bookmarks.value.length)

  function clear() {
    bookmarks.value = []
    initializedForUser.value = null
    actionError.value = null
  }

  function isBookmarked(type: BookmarkResourceType, slug: string) {
    return bookmarkKeys.value.has(getBookmarkKey(type, slug))
  }

  async function loadBookmarks(force = false): Promise<BookmarkActionResult> {
    const auth = useAuthStore()
    await auth.initialize()

    if (!auth.user) {
      clear()
      return { ok: false, requiresAuth: true }
    }

    if (!supabase) {
      actionError.value = SUPABASE_CONFIG_ERROR
      return { ok: false, message: SUPABASE_CONFIG_ERROR }
    }

    if (!force && initializedForUser.value === auth.user.id) {
      return { ok: true }
    }

    loading.value = true
    actionError.value = null

    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select(BOOKMARK_COLUMNS)
        .eq('user_id', auth.user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      bookmarks.value = (data ?? []) as UserBookmark[]
      initializedForUser.value = auth.user.id
      return { ok: true }
    } catch (error) {
      const message = getBookmarkErrorMessage(error)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function removeBookmark(id: string): Promise<BookmarkActionResult> {
    if (!supabase) {
      actionError.value = SUPABASE_CONFIG_ERROR
      return { ok: false, message: SUPABASE_CONFIG_ERROR }
    }

    loading.value = true
    actionError.value = null

    try {
      const { error } = await supabase.from('user_bookmarks').delete().eq('id', id)

      if (error) {
        throw error
      }

      bookmarks.value = bookmarks.value.filter((bookmark) => bookmark.id !== id)
      return { ok: true }
    } catch (error) {
      const message = getBookmarkErrorMessage(error)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function removeBookmarkByResource(
    type: BookmarkResourceType,
    slug: string,
  ): Promise<BookmarkActionResult> {
    const bookmark = bookmarks.value.find(
      (item) => item.resource_type === type && item.resource_slug === slug,
    )

    if (!bookmark) {
      return { ok: true }
    }

    return removeBookmark(bookmark.id)
  }

  async function createBookmark(resource: BookmarkResource): Promise<BookmarkActionResult> {
    const auth = useAuthStore()
    await auth.initialize()

    if (!auth.user) {
      return { ok: false, requiresAuth: true }
    }

    if (!supabase) {
      actionError.value = SUPABASE_CONFIG_ERROR
      return { ok: false, message: SUPABASE_CONFIG_ERROR }
    }

    loading.value = true
    actionError.value = null

    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: auth.user.id,
          resource_type: resource.type,
          resource_slug: resource.slug,
          title: resource.title,
          url: resource.url ?? null,
          category: resource.category ?? null,
        })
        .select(BOOKMARK_COLUMNS)
        .single()

      if (error) {
        const code = 'code' in error ? error.code : undefined
        if (code === '23505') {
          await loadBookmarks(true)
          return { ok: true }
        }

        throw error
      }

      bookmarks.value = [data as UserBookmark, ...bookmarks.value]
      initializedForUser.value = auth.user.id
      trackBookmark(resource.type, resource.slug)
      return { ok: true }
    } catch (error) {
      const message = getBookmarkErrorMessage(error)
      actionError.value = message
      return { ok: false, message }
    } finally {
      loading.value = false
    }
  }

  async function toggleBookmark(resource: BookmarkResource): Promise<BookmarkActionResult> {
    const loadResult = await loadBookmarks()
    if (!loadResult.ok) {
      return loadResult
    }

    if (isBookmarked(resource.type, resource.slug)) {
      return removeBookmarkByResource(resource.type, resource.slug)
    }

    return createBookmark(resource)
  }

  return {
    actionError,
    bookmarkCount,
    bookmarks,
    clear,
    isBookmarked,
    loadBookmarks,
    loading,
    removeBookmark,
    toggleBookmark,
  }
})
