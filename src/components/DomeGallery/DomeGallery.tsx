import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import './DomeGallery.css'

type ImageItem = string | { src: string; alt?: string }

type DomeGalleryProps = {
  images?: ImageItem[]
  fit?: number
  minRadius?: number
  maxVerticalRotationDeg?: number
  segments?: number
  dragDampening?: number
  autoRotateSpeed?: number
  overlayBlurColor?: string
  imageBorderRadius?: string
  grayscale?: boolean
}

type DomeItem = {
  src: string
  alt: string
  x: number
  y: number
  sizeX: number
  sizeY: number
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const wrapAngle = (value: number) => {
  const angle = (((value + 180) % 360) + 360) % 360
  return angle - 180
}

function normalizeImages(images: ImageItem[]) {
  return images
    .map((image) => (typeof image === 'string' ? { src: image, alt: '' } : { src: image.src, alt: image.alt ?? '' }))
    .filter((image) => image.src)
}

function buildItems(images: ImageItem[], segments: number): DomeItem[] {
  const normalized = normalizeImages(images)
  const columns = Array.from({ length: segments }, (_, index) => -segments + index * 2)
  const evenRows = [-4, -2, 0, 2, 4]
  const oddRows = [-3, -1, 1, 3, 5]

  return columns.flatMap((x, columnIndex) => {
    const rows = columnIndex % 2 === 0 ? evenRows : oddRows

    return rows.map((y, rowIndex) => {
      const image = normalized[(columnIndex * rows.length + rowIndex) % Math.max(normalized.length, 1)]
      return {
        src: image?.src ?? '',
        alt: image?.alt ?? '',
        x,
        y,
        sizeX: 2,
        sizeY: 2,
      }
    })
  })
}

export default function DomeGallery({
  images = [],
  fit = 1,
  minRadius = 500,
  maxVerticalRotationDeg = 9,
  segments = 34,
  dragDampening = 4.8,
  autoRotateSpeed = 1.4,
  overlayBlurColor = '#ffffff',
  imageBorderRadius = '22px',
  grayscale = false,
}: DomeGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLElement>(null)
  const sphereRef = useRef<HTMLDivElement>(null)
  const inertiaRef = useRef<number | undefined>(undefined)
  const autoRotateRef = useRef<number | undefined>(undefined)
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0, rotX: 0, rotY: 0 })
  const lastMoveRef = useRef({ x: 0, y: 0, time: 0, vx: 0, vy: 0 })
  const rotationRef = useRef({ x: 0, y: 0 })
  const [selectedImage, setSelectedImage] = useState<{ src: string; alt: string } | null>(null)
  const items = useMemo(() => buildItems(images, segments), [images, segments])

  const applyTransform = useCallback((x: number, y: number) => {
    if (!sphereRef.current) return
    sphereRef.current.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${x}deg) rotateY(${y}deg)`
  }, [])

  const stopInertia = useCallback(() => {
    if (inertiaRef.current) {
      cancelAnimationFrame(inertiaRef.current)
      inertiaRef.current = undefined
    }
  }, [])

  const startInertia = useCallback(
    (vx: number, vy: number) => {
      stopInertia()
      let speedX = clamp(vx * 16, -3.2, 3.2)
      let speedY = clamp(vy * 16, -3.2, 3.2)
      const friction = clamp(0.94 + dragDampening * 0.01, 0.94, 0.985)

      const tick = () => {
        speedX *= friction
        speedY *= friction
        if (Math.abs(speedX) < 0.01 && Math.abs(speedY) < 0.01) {
          inertiaRef.current = undefined
          return
        }

        const nextX = clamp(rotationRef.current.x - speedY, -maxVerticalRotationDeg, maxVerticalRotationDeg)
        const nextY = wrapAngle(rotationRef.current.y + speedX)
        rotationRef.current = { x: nextX, y: nextY }
        applyTransform(nextX, nextY)
        inertiaRef.current = requestAnimationFrame(tick)
      }

      inertiaRef.current = requestAnimationFrame(tick)
    },
    [applyTransform, dragDampening, maxVerticalRotationDeg, stopInertia],
  )

  useEffect(() => {
    let lastTime = performance.now()

    const tick = (time: number) => {
      const deltaSeconds = Math.min(0.05, (time - lastTime) / 1000)
      lastTime = time

      if (!draggingRef.current && !selectedImage && !inertiaRef.current) {
        const nextY = wrapAngle(rotationRef.current.y + autoRotateSpeed * deltaSeconds)
        rotationRef.current = { ...rotationRef.current, y: nextY }
        applyTransform(rotationRef.current.x, nextY)
      }

      autoRotateRef.current = requestAnimationFrame(tick)
    }

    autoRotateRef.current = requestAnimationFrame(tick)
    return () => {
      if (autoRotateRef.current) cancelAnimationFrame(autoRotateRef.current)
    }
  }, [applyTransform, autoRotateSpeed, selectedImage])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const updateRadius = () => {
      const rect = root.getBoundingClientRect()
      const base = Math.min(rect.width, rect.height * 1.18)
      const radius = Math.max(minRadius, Math.round(base * fit))
      root.style.setProperty('--radius', `${radius}px`)
      root.style.setProperty('--segments-x', `${segments}`)
      root.style.setProperty('--segments-y', `${segments}`)
      root.style.setProperty('--overlay-blur-color', overlayBlurColor)
      root.style.setProperty('--tile-radius', imageBorderRadius)
      root.style.setProperty('--image-filter', grayscale ? 'grayscale(1)' : 'none')
      applyTransform(rotationRef.current.x, rotationRef.current.y)
    }

    updateRadius()
    const observer = new ResizeObserver(updateRadius)
    observer.observe(root)
    return () => observer.disconnect()
  }, [applyTransform, fit, grayscale, imageBorderRadius, minRadius, overlayBlurColor, segments])

  const handlePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (selectedImage) return
    stopInertia()
    draggingRef.current = true
    movedRef.current = false
    startRef.current = {
      x: event.clientX,
      y: event.clientY,
      rotX: rotationRef.current.x,
      rotY: rotationRef.current.y,
    }
    lastMoveRef.current = { x: event.clientX, y: event.clientY, time: performance.now(), vx: 0, vy: 0 }
    mainRef.current?.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current || selectedImage) return
    const dx = event.clientX - startRef.current.x
    const dy = event.clientY - startRef.current.y
    if (dx * dx + dy * dy > 16) movedRef.current = true

    const now = performance.now()
    const elapsed = Math.max(16, now - lastMoveRef.current.time)
    const nextX = clamp(startRef.current.rotX - dy / 20, -maxVerticalRotationDeg, maxVerticalRotationDeg)
    const nextY = wrapAngle(startRef.current.rotY + dx / 20)
    lastMoveRef.current = {
      x: event.clientX,
      y: event.clientY,
      time: now,
      vx: ((event.clientX - lastMoveRef.current.x) / elapsed) * 16,
      vy: ((event.clientY - lastMoveRef.current.y) / elapsed) * 16,
    }
    rotationRef.current = { x: nextX, y: nextY }
    applyTransform(nextX, nextY)
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLElement>) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    mainRef.current?.releasePointerCapture(event.pointerId)
    const { vx, vy } = lastMoveRef.current
    if (Math.abs(vx) > 0.02 || Math.abs(vy) > 0.02) startInertia(vx, vy)
    window.setTimeout(() => {
      movedRef.current = false
    }, 80)
  }

  return (
    <div className="sphere-root" ref={rootRef}>
      <main
        className="sphere-main"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        ref={mainRef}
      >
        <div className="stage">
          <div className="sphere" ref={sphereRef}>
            {items.map((item, index) => (
              <div
                className="item"
                key={`${item.x}-${item.y}-${index}`}
                style={
                  {
                    '--offset-x': item.x,
                    '--offset-y': item.y,
                    '--item-size-x': item.sizeX,
                    '--item-size-y': item.sizeY,
                  } as CSSProperties
                }
              >
                <button
                  aria-label={item.alt}
                  className="item__image"
                  onClick={() => {
                    if (!movedRef.current) setSelectedImage({ src: item.src, alt: item.alt })
                  }}
                  type="button"
                >
                  <img alt={item.alt} draggable={false} src={item.src} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />
      </main>

      {selectedImage ? (
        <button aria-label="关闭图片预览" className="dome-viewer" onClick={() => setSelectedImage(null)} type="button">
          <span className="dome-viewer__scrim" />
          <img alt={selectedImage.alt} className="dome-viewer__image" src={selectedImage.src} />
        </button>
      ) : null}
    </div>
  )
}
