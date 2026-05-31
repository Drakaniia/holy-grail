<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from 'vue'

type ShapeGridDirection = 'diagonal' | 'up' | 'right' | 'down' | 'left'
type ShapeGridShape = 'square' | 'hexagon' | 'circle' | 'triangle'

interface ShapeGridProps {
  direction?: ShapeGridDirection
  speed?: number
  borderColor?: string
  squareSize?: number
  hoverFillColor?: string
  shape?: ShapeGridShape
  hoverTrailAmount?: number
  className?: string
}

interface GridCell {
  x: number
  y: number
}

const props = withDefaults(defineProps<ShapeGridProps>(), {
  direction: 'right',
  speed: 1,
  borderColor: '#999',
  squareSize: 40,
  hoverFillColor: '#222',
  shape: 'square',
  hoverTrailAmount: 0,
  className: '',
})

const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')

let stopCurrentGrid: (() => void) | undefined

function positiveModulo(value: number, divisor: number) {
  return ((value % divisor) + divisor) % divisor
}

function startGrid() {
  stopCurrentGrid?.()
  stopCurrentGrid = undefined

  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')

  if (!canvas || !ctx) return

  const tileSize = Math.max(props.squareSize, 4)
  const trailAmount = Math.max(0, Math.floor(props.hoverTrailAmount))
  const isHex = props.shape === 'hexagon'
  const isTri = props.shape === 'triangle'
  const hexHoriz = tileSize * 1.5
  const hexVert = tileSize * Math.sqrt(3)
  const gridOffset = { x: 0, y: 0 }
  const trailCells: GridCell[] = []
  const cellOpacities = new Map<string, number>()

  let hoveredCell: GridCell | null = null
  let canvasWidth = 0
  let canvasHeight = 0
  let requestId = 0
  let resizeObserver: ResizeObserver | undefined

  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  let reduceMotion = motionQuery.matches

  const handleMotionPreference = (event: MediaQueryListEvent) => {
    reduceMotion = event.matches
  }

  const resizeCanvas = () => {
    const rect = canvas.getBoundingClientRect()
    const pixelRatio = Math.max(window.devicePixelRatio || 1, 1)

    canvasWidth = rect.width
    canvasHeight = rect.height
    canvas.width = Math.max(Math.floor(canvasWidth * pixelRatio), 1)
    canvas.height = Math.max(Math.floor(canvasHeight * pixelRatio), 1)
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }

  const drawHex = (cx: number, cy: number, size: number) => {
    ctx.beginPath()
    for (let index = 0; index < 6; index += 1) {
      const angle = (Math.PI / 3) * index
      const vx = cx + size * Math.cos(angle)
      const vy = cy + size * Math.sin(angle)

      if (index === 0) ctx.moveTo(vx, vy)
      else ctx.lineTo(vx, vy)
    }
    ctx.closePath()
  }

  const drawCircle = (cx: number, cy: number, size: number) => {
    ctx.beginPath()
    ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
    ctx.closePath()
  }

  const drawTriangle = (cx: number, cy: number, size: number, flip: boolean) => {
    ctx.beginPath()
    if (flip) {
      ctx.moveTo(cx, cy + size / 2)
      ctx.lineTo(cx + size / 2, cy - size / 2)
      ctx.lineTo(cx - size / 2, cy - size / 2)
    } else {
      ctx.moveTo(cx, cy - size / 2)
      ctx.lineTo(cx + size / 2, cy + size / 2)
      ctx.lineTo(cx - size / 2, cy + size / 2)
    }
    ctx.closePath()
  }

  const fillHoveredCell = (cellKey: string, drawCell: () => void) => {
    const alpha = cellOpacities.get(cellKey)
    if (!alpha) return

    ctx.globalAlpha = alpha
    drawCell()
    ctx.fillStyle = props.hoverFillColor
    ctx.fill()
    ctx.globalAlpha = 1
  }

  const drawGrid = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz)
      const offsetX = positiveModulo(gridOffset.x, hexHoriz)
      const offsetY = positiveModulo(gridOffset.y, hexVert)
      const cols = Math.ceil(canvasWidth / hexHoriz) + 3
      const rows = Math.ceil(canvasHeight / hexVert) + 3

      for (let col = -2; col < cols; col += 1) {
        for (let row = -2; row < rows; row += 1) {
          const cx = col * hexHoriz + offsetX
          const cy =
            row * hexVert +
            ((col + colShift) % 2 !== 0 ? hexVert / 2 : 0) +
            offsetY
          const cellKey = `${col},${row}`

          fillHoveredCell(cellKey, () => drawHex(cx, cy, tileSize))
          drawHex(cx, cy, tileSize)
          ctx.strokeStyle = props.borderColor
          ctx.stroke()
        }
      }

      return
    }

    if (isTri) {
      const halfW = tileSize / 2
      const colShift = Math.floor(gridOffset.x / halfW)
      const rowShift = Math.floor(gridOffset.y / tileSize)
      const offsetX = positiveModulo(gridOffset.x, halfW)
      const offsetY = positiveModulo(gridOffset.y, tileSize)
      const cols = Math.ceil(canvasWidth / halfW) + 4
      const rows = Math.ceil(canvasHeight / tileSize) + 4

      for (let col = -2; col < cols; col += 1) {
        for (let row = -2; row < rows; row += 1) {
          const cx = col * halfW + offsetX
          const cy = row * tileSize + tileSize / 2 + offsetY
          const flip = positiveModulo(col + colShift + row + rowShift, 2) !== 0
          const cellKey = `${col},${row}`

          fillHoveredCell(cellKey, () => drawTriangle(cx, cy, tileSize, flip))
          drawTriangle(cx, cy, tileSize, flip)
          ctx.strokeStyle = props.borderColor
          ctx.stroke()
        }
      }

      return
    }

    const offsetX = positiveModulo(gridOffset.x, tileSize)
    const offsetY = positiveModulo(gridOffset.y, tileSize)
    const cols = Math.ceil(canvasWidth / tileSize) + 3
    const rows = Math.ceil(canvasHeight / tileSize) + 3

    for (let col = -2; col < cols; col += 1) {
      for (let row = -2; row < rows; row += 1) {
        const cellKey = `${col},${row}`

        if (props.shape === 'circle') {
          const cx = col * tileSize + tileSize / 2 + offsetX
          const cy = row * tileSize + tileSize / 2 + offsetY

          fillHoveredCell(cellKey, () => drawCircle(cx, cy, tileSize))
          drawCircle(cx, cy, tileSize)
          ctx.strokeStyle = props.borderColor
          ctx.stroke()
        } else {
          const sx = col * tileSize + offsetX
          const sy = row * tileSize + offsetY
          const alpha = cellOpacities.get(cellKey)

          if (alpha) {
            ctx.globalAlpha = alpha
            ctx.fillStyle = props.hoverFillColor
            ctx.fillRect(sx, sy, tileSize, tileSize)
            ctx.globalAlpha = 1
          }

          ctx.strokeStyle = props.borderColor
          ctx.strokeRect(sx, sy, tileSize, tileSize)
        }
      }
    }
  }

  const pushTrailCell = (cell: GridCell) => {
    if (trailAmount === 0) return

    trailCells.unshift({ ...cell })
    if (trailCells.length > trailAmount) trailCells.length = trailAmount
  }

  const setHoveredCell = (cell: GridCell) => {
    if (hoveredCell?.x === cell.x && hoveredCell.y === cell.y) return

    if (hoveredCell) pushTrailCell(hoveredCell)
    hoveredCell = cell
  }

  const updateCellOpacities = () => {
    const targets = new Map<string, number>()

    if (hoveredCell) {
      targets.set(`${hoveredCell.x},${hoveredCell.y}`, 1)
    }

    if (trailAmount > 0) {
      for (let index = 0; index < trailCells.length; index += 1) {
        const trail = trailCells[index]
        const key = `${trail.x},${trail.y}`

        if (!targets.has(key)) {
          targets.set(key, (trailCells.length - index) / (trailCells.length + 1))
        }
      }
    }

    for (const key of targets.keys()) {
      if (!cellOpacities.has(key)) {
        cellOpacities.set(key, 0)
      }
    }

    for (const [key, opacity] of Array.from(cellOpacities.entries())) {
      const target = targets.get(key) || 0
      const next = opacity + (target - opacity) * 0.15

      if (next < 0.005) {
        cellOpacities.delete(key)
      } else {
        cellOpacities.set(key, next)
      }
    }
  }

  const updateAnimation = () => {
    const effectiveSpeed = reduceMotion ? 0 : Math.max(props.speed, 0.1)
    const wrapX = isHex ? hexHoriz * 2 : tileSize
    const wrapY = isHex ? hexVert : isTri ? tileSize * 2 : tileSize

    switch (props.direction) {
      case 'right':
        gridOffset.x = positiveModulo(gridOffset.x - effectiveSpeed, wrapX)
        break
      case 'left':
        gridOffset.x = positiveModulo(gridOffset.x + effectiveSpeed, wrapX)
        break
      case 'up':
        gridOffset.y = positiveModulo(gridOffset.y + effectiveSpeed, wrapY)
        break
      case 'down':
        gridOffset.y = positiveModulo(gridOffset.y - effectiveSpeed, wrapY)
        break
      case 'diagonal':
        gridOffset.x = positiveModulo(gridOffset.x - effectiveSpeed, wrapX)
        gridOffset.y = positiveModulo(gridOffset.y - effectiveSpeed, wrapY)
        break
      default:
        break
    }

    updateCellOpacities()
    drawGrid()
    requestId = window.requestAnimationFrame(updateAnimation)
  }

  const handlePointerMove = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    if (isHex) {
      const colShift = Math.floor(gridOffset.x / hexHoriz)
      const offsetX = positiveModulo(gridOffset.x, hexHoriz)
      const offsetY = positiveModulo(gridOffset.y, hexVert)
      const adjustedX = mouseX - offsetX
      const adjustedY = mouseY - offsetY
      const col = Math.round(adjustedX / hexHoriz)
      const rowOffset = (col + colShift) % 2 !== 0 ? hexVert / 2 : 0
      const row = Math.round((adjustedY - rowOffset) / hexVert)

      setHoveredCell({ x: col, y: row })
      return
    }

    if (isTri) {
      const halfW = tileSize / 2
      const offsetX = positiveModulo(gridOffset.x, halfW)
      const offsetY = positiveModulo(gridOffset.y, tileSize)
      const adjustedX = mouseX - offsetX
      const adjustedY = mouseY - offsetY
      const col = Math.round(adjustedX / halfW)
      const row = Math.floor(adjustedY / tileSize)

      setHoveredCell({ x: col, y: row })
      return
    }

    const offsetX = positiveModulo(gridOffset.x, tileSize)
    const offsetY = positiveModulo(gridOffset.y, tileSize)
    const adjustedX = mouseX - offsetX
    const adjustedY = mouseY - offsetY
    const col =
      props.shape === 'circle'
        ? Math.round(adjustedX / tileSize)
        : Math.floor(adjustedX / tileSize)
    const row =
      props.shape === 'circle'
        ? Math.round(adjustedY / tileSize)
        : Math.floor(adjustedY / tileSize)

    setHoveredCell({ x: col, y: row })
  }

  const handlePointerLeave = () => {
    if (hoveredCell) pushTrailCell(hoveredCell)
    hoveredCell = null
  }

  resizeCanvas()

  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resizeCanvas)
    resizeObserver.observe(canvas)
  } else {
    window.addEventListener('resize', resizeCanvas)
  }

  motionQuery.addEventListener('change', handleMotionPreference)
  canvas.addEventListener('pointermove', handlePointerMove)
  canvas.addEventListener('pointerleave', handlePointerLeave)
  requestId = window.requestAnimationFrame(updateAnimation)

  stopCurrentGrid = () => {
    resizeObserver?.disconnect()
    window.removeEventListener('resize', resizeCanvas)
    motionQuery.removeEventListener('change', handleMotionPreference)
    canvas.removeEventListener('pointermove', handlePointerMove)
    canvas.removeEventListener('pointerleave', handlePointerLeave)
    window.cancelAnimationFrame(requestId)
  }
}

onMounted(startGrid)

watch(
  () => [
    props.direction,
    props.speed,
    props.borderColor,
    props.hoverFillColor,
    props.squareSize,
    props.shape,
    props.hoverTrailAmount,
  ],
  () => startGrid(),
  { flush: 'post' },
)

onUnmounted(() => {
  stopCurrentGrid?.()
})
</script>

<template>
  <canvas ref="canvas" :class="['shapegrid-canvas', props.className]"></canvas>
</template>

<style scoped>
.shapegrid-canvas {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
}
</style>
