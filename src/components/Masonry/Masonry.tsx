import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { gsap } from 'gsap'
import './Masonry.css'

type MasonryItem = {
  id: string
  img: string
  url?: string
  height: number
}

type GridItem = MasonryItem & {
  x: number
  y: number
  w: number
  h: number
}

type MasonryProps = {
  items: MasonryItem[]
  ease?: string
  duration?: number
  stagger?: number
  animateFrom?: 'bottom' | 'top' | 'left' | 'right' | 'center' | 'random'
  scaleOnHover?: boolean
  hoverScale?: number
  blurToFocus?: boolean
  colorShiftOnHover?: boolean
}

const columnQueries = ['(min-width:1500px)', '(min-width:1000px)', '(min-width:600px)', '(min-width:400px)']
const columnValues = [5, 4, 3, 2]

const useMedia = (queries: string[], values: number[], defaultValue: number): number => {
  const getValue = () => values[queries.findIndex((query) => matchMedia(query).matches)] ?? defaultValue
  const [value, setValue] = useState<number>(getValue)

  useEffect(() => {
    const handler = () => setValue(getValue())
    queries.forEach((query) => matchMedia(query).addEventListener('change', handler))
    return () => queries.forEach((query) => matchMedia(query).removeEventListener('change', handler))
  }, [queries, values])

  return value
}

const useMeasure = <T extends HTMLElement>() => {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    if (!ref.current) return undefined
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize({ width, height })
    })
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}

const preloadImages = async (urls: string[]): Promise<void> => {
  await Promise.all(
    urls.map(
      (src) =>
        new Promise<void>((resolve) => {
          const image = new Image()
          image.src = src
          image.onload = image.onerror = () => resolve()
        }),
    ),
  )
}

export default function Masonry({
  items,
  ease = 'power3.out',
  duration = 0.6,
  stagger = 0.05,
  animateFrom = 'bottom',
  scaleOnHover = true,
  hoverScale = 0.95,
  blurToFocus = true,
  colorShiftOnHover = false,
}: MasonryProps) {
  const columns = useMedia(columnQueries, columnValues, 1)
  const [containerRef, { width }] = useMeasure<HTMLDivElement>()
  const [imagesReady, setImagesReady] = useState(false)
  const hasMounted = useRef(false)

  useEffect(() => {
    let isMounted = true
    setImagesReady(false)
    preloadImages(items.map((item) => item.img)).then(() => {
      if (isMounted) setImagesReady(true)
    })
    return () => {
      isMounted = false
    }
  }, [items])

  const grid = useMemo<GridItem[]>(() => {
    if (!width) return []

    const gap = 24
    const colHeights = new Array(columns).fill(0)
    const columnWidth = (width - gap * (columns - 1)) / columns

    return items.map((item) => {
      const col = colHeights.indexOf(Math.min(...colHeights))
      const x = (columnWidth + gap) * col
      const height = item.height / 2
      const y = colHeights[col]

      colHeights[col] += height + gap

      return { ...item, x, y, w: columnWidth, h: height }
    })
  }, [columns, items, width])

  const containerHeight = useMemo(() => Math.max(520, ...grid.map((item) => item.y + item.h)), [grid])

  const getInitialPosition = (item: GridItem) => {
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return { x: item.x, y: item.y }
    const directions = ['top', 'bottom', 'left', 'right'] as const
    const direction = animateFrom === 'random' ? directions[Math.floor(Math.random() * directions.length)] : animateFrom

    switch (direction) {
      case 'top':
        return { x: item.x, y: -220 }
      case 'bottom':
        return { x: item.x, y: window.innerHeight + 220 }
      case 'left':
        return { x: -240, y: item.y }
      case 'right':
        return { x: window.innerWidth + 240, y: item.y }
      case 'center':
        return {
          x: containerRect.width / 2 - item.w / 2,
          y: containerRect.height / 2 - item.h / 2,
        }
      default:
        return { x: item.x, y: item.y + 100 }
    }
  }

  useLayoutEffect(() => {
    if (!imagesReady || !grid.length) return

    grid.forEach((item, index) => {
      const selector = `[data-key="${item.id}"]`
      const animationProps = {
        x: item.x,
        y: item.y,
        width: item.w,
        height: item.h,
      }

      if (!hasMounted.current) {
        const initialPosition = getInitialPosition(item)
        gsap.fromTo(
          selector,
          {
            opacity: 0,
            x: initialPosition.x,
            y: initialPosition.y,
            width: item.w,
            height: item.h,
            ...(blurToFocus ? { filter: 'blur(10px)' } : {}),
          },
          {
            opacity: 1,
            ...animationProps,
            ...(blurToFocus ? { filter: 'blur(0px)' } : {}),
            duration: 0.8,
            ease: 'power3.out',
            delay: index * stagger,
          },
        )
      } else {
        gsap.to(selector, {
          ...animationProps,
          duration,
          ease,
          overwrite: 'auto',
        })
      }
    })

    hasMounted.current = true
  }, [animateFrom, blurToFocus, duration, ease, grid, imagesReady, stagger])

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>, item: GridItem) => {
    const selector = `[data-key="${item.id}"]`

    if (scaleOnHover) {
      gsap.to(selector, {
        scale: hoverScale,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    if (colorShiftOnHover) {
      const overlay = event.currentTarget.querySelector('.color-overlay')
      if (overlay) gsap.to(overlay, { opacity: 0.3, duration: 0.3 })
    }
  }

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>, item: GridItem) => {
    const selector = `[data-key="${item.id}"]`

    if (scaleOnHover) {
      gsap.to(selector, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out',
      })
    }

    if (colorShiftOnHover) {
      const overlay = event.currentTarget.querySelector('.color-overlay')
      if (overlay) gsap.to(overlay, { opacity: 0, duration: 0.3 })
    }
  }

  return (
    <div className="masonry-list" ref={containerRef} style={{ height: containerHeight }}>
      {grid.map((item) => (
        <div
          className="masonry-item-wrapper"
          data-key={item.id}
          key={item.id}
          onClick={() => {
            if (item.url) window.open(item.url, '_blank', 'noopener')
          }}
          onMouseEnter={(event) => handleMouseEnter(event, item)}
          onMouseLeave={(event) => handleMouseLeave(event, item)}
        >
          <div className="masonry-item-img" style={{ backgroundImage: `url(${item.img})` }}>
            {colorShiftOnHover ? <div className="color-overlay" /> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
