import { computed, onUnmounted, shallowRef, watch, type ComputedRef } from 'vue'
import type { HomePreviewItem } from '@/types/home'

export interface RandomPreviewTile {
  key: string
  item: HomePreviewItem
  previousItem: HomePreviewItem | null
  animationNonce: number
}

interface UseRandomPreviewTilesOptions {
  items: ComputedRef<HomePreviewItem[]>
  tileCount: number
  initialDelayRange?: [number, number]
  rotationDelayRange?: [number, number]
  previousImageResetDelay?: number
}

function getRandomIndex(length: number) {
  return Math.floor(Math.random() * length)
}

function getRandomDelay([minimum, maximum]: [number, number]) {
  return minimum + getRandomIndex(Math.max(1, maximum - minimum))
}

function takeRandomItems(
  items: HomePreviewItem[],
  count: number,
  blockedSlugs = new Set<string>(),
) {
  const options = items.filter(item => !blockedSlugs.has(item.slug))
  const selected: HomePreviewItem[] = []

  while (selected.length < count && options.length > 0) {
    const index = getRandomIndex(options.length)
    const [item] = options.splice(index, 1)

    if (item) {
      selected.push(item)
    }
  }

  return selected
}

export function useRandomPreviewTiles({
  items,
  tileCount,
  initialDelayRange = [80, 1400],
  rotationDelayRange = [1800, 5400],
  previousImageResetDelay = 920,
}: UseRandomPreviewTilesOptions) {
  const failedSlugs = shallowRef(new Set<string>())
  const tiles = shallowRef<RandomPreviewTile[]>([])
  const rotationTimers = new Map<string, ReturnType<typeof window.setTimeout>>()
  const previousImageResetTimers = new Map<string, ReturnType<typeof window.setTimeout>>()
  const pendingImageLoads = new Map<string, Promise<void>>()
  const loadedImageUrls = new Set<string>()
  let isDisposed = false

  const candidateItems = computed(() =>
    items.value.filter(item => !failedSlugs.value.has(item.slug)),
  )

  function getPreviewImageUrl(item: HomePreviewItem) {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 720px)').matches) {
      return item.small || item.image
    }

    return item.image || item.small
  }

  async function preloadImageUrl(url: string) {
    if (!url || loadedImageUrls.has(url)) return

    const pendingLoad = pendingImageLoads.get(url)

    if (pendingLoad) {
      await pendingLoad
      return
    }

    const load = new Promise<void>((resolve, reject) => {
      const image = new Image()

      image.decoding = 'async'
      image.onload = () => {
        const decode = image.decode
          ? image.decode().catch(() => undefined)
          : Promise.resolve()

        void decode.finally(() => {
          loadedImageUrls.add(url)
          resolve()
        })
      }
      image.onerror = () => reject(new Error(`Failed to load preview image: ${url}`))
      image.src = url
    }).finally(() => {
      pendingImageLoads.delete(url)
    })

    pendingImageLoads.set(url, load)
    await load
  }

  async function preloadPreviewImage(item: HomePreviewItem) {
    try {
      await preloadImageUrl(getPreviewImageUrl(item))
      return true
    } catch {
      markImageFailed(item.slug)
      return false
    }
  }

  function clearTileTimers(tileKey: string) {
    const rotationTimer = rotationTimers.get(tileKey)
    const resetTimer = previousImageResetTimers.get(tileKey)

    if (rotationTimer) {
      window.clearTimeout(rotationTimer)
    }

    if (resetTimer) {
      window.clearTimeout(resetTimer)
    }

    rotationTimers.delete(tileKey)
    previousImageResetTimers.delete(tileKey)
  }

  function clearAllTimers() {
    rotationTimers.forEach(timer => window.clearTimeout(timer))
    previousImageResetTimers.forEach(timer => window.clearTimeout(timer))
    rotationTimers.clear()
    previousImageResetTimers.clear()
  }

  function queuePreviousImageReset(tileKey: string) {
    const resetTimer = previousImageResetTimers.get(tileKey)

    if (resetTimer) {
      window.clearTimeout(resetTimer)
    }

    previousImageResetTimers.set(tileKey, window.setTimeout(() => {
      tiles.value = tiles.value.map(tile => ({
        ...tile,
        previousItem: tile.key === tileKey ? null : tile.previousItem,
      }))
      previousImageResetTimers.delete(tileKey)
    }, previousImageResetDelay))
  }

  async function rotateTilePreview(tileKey: string) {
    const currentTile = tiles.value.find(tile => tile.key === tileKey)

    if (!currentTile) return

    const currentSlugs = new Set(tiles.value.map(tile => tile.item.slug))
    const [replacementItem] = takeRandomItems(candidateItems.value, 1, currentSlugs)
    const [fallbackItem] = takeRandomItems(
      candidateItems.value,
      1,
      new Set([currentTile.item.slug]),
    )
    const item = replacementItem ?? fallbackItem

    if (!item || item.slug === currentTile.item.slug) return

    const isImageReady = await preloadPreviewImage(item)
    const latestTile = tiles.value.find(tile => tile.key === tileKey)
    const isVisibleElsewhere = tiles.value.some(tile =>
      tile.key !== tileKey && tile.item.slug === item.slug,
    )

    if (!isImageReady || !latestTile || isDisposed || isVisibleElsewhere) return

    tiles.value = tiles.value.map(tile =>
      tile.key === tileKey
        ? {
            ...tile,
            item,
            previousItem: latestTile.item,
            animationNonce: tile.animationNonce + 1,
          }
        : tile,
    )
    queuePreviousImageReset(tileKey)
  }

  function scheduleTileRotation(tileKey: string, isInitial = false) {
    const rotationTimer = rotationTimers.get(tileKey)

    if (rotationTimer) {
      window.clearTimeout(rotationTimer)
    }

    rotationTimers.set(tileKey, window.setTimeout(() => {
      void rotateTilePreview(tileKey).finally(() => {
        if (!isDisposed && tiles.value.some(tile => tile.key === tileKey)) {
          scheduleTileRotation(tileKey)
        }
      })
    }, getRandomDelay(isInitial ? initialDelayRange : rotationDelayRange)))
  }

  function syncTiles(nextItems: HomePreviewItem[]) {
    if (nextItems.length === 0) {
      clearAllTimers()
      tiles.value = []
      return
    }

    const availableSlugs = new Set(nextItems.map(item => item.slug))
    const preservedTiles = tiles.value.filter(tile => availableSlugs.has(tile.item.slug))
    const preservedSlugs = new Set(preservedTiles.map(tile => tile.item.slug))
    const refillItems = takeRandomItems(
      nextItems,
      Math.max(0, tileCount - preservedTiles.length),
      preservedSlugs,
    )
    const refillTiles = refillItems.map((item, index) => ({
      key: `tile-${preservedTiles.length + index}`,
      item,
      previousItem: null,
      animationNonce: 0,
    }))
    const nextTiles = [...preservedTiles, ...refillTiles].slice(0, tileCount)
    const nextTileKeys = new Set(nextTiles.map(tile => tile.key))

    tiles.value = nextTiles

    Array.from(rotationTimers.keys())
      .filter(tileKey => !nextTileKeys.has(tileKey))
      .forEach(clearTileTimers)

    nextTiles
      .filter(tile => !rotationTimers.has(tile.key))
      .forEach(tile => scheduleTileRotation(tile.key, true))
  }

  function markImageFailed(slug: string) {
    failedSlugs.value = new Set([...failedSlugs.value, slug])
  }

  watch(candidateItems, syncTiles, { immediate: true })

  onUnmounted(() => {
    isDisposed = true
    clearAllTimers()
  })

  return {
    markImageFailed,
    tiles,
  }
}
