import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface ClickSparkProps {
  sparkColor?: string
  sparkSize?: number
  sparkRadius?: number
  sparkCount?: number
  duration?: number
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  extraScale?: number
  children?: ReactNode
}

interface Spark {
  x: number
  y: number
  angle: number
  startTime: number
}

function ClickSpark({
  sparkColor = '#0a0d0b',
  sparkSize = 18,
  sparkRadius = 35,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1,
  children,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sparksRef = useRef<Spark[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    const parent = canvas?.parentElement
    if (!canvas || !parent) return undefined

    let resizeTimeout: number | undefined

    const resizeCanvas = () => {
      const { width, height } = parent.getBoundingClientRect()
      const pixelRatio = window.devicePixelRatio || 1
      const nextWidth = Math.round(width * pixelRatio)
      const nextHeight = Math.round(height * pixelRatio)

      if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
        canvas.width = nextWidth
        canvas.height = nextHeight
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }
    }

    const handleResize = () => {
      window.clearTimeout(resizeTimeout)
      resizeTimeout = window.setTimeout(resizeCanvas, 100)
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(parent)
    resizeCanvas()

    return () => {
      observer.disconnect()
      window.clearTimeout(resizeTimeout)
    }
  }, [])

  const easeFunc = useCallback(
    (progress: number) => {
      switch (easing) {
        case 'linear':
          return progress
        case 'ease-in':
          return progress * progress
        case 'ease-in-out':
          return progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress
        default:
          return progress * (2 - progress)
      }
    },
    [easing],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return undefined

    let animationId = 0

    const draw = (timestamp: number) => {
      const pixelRatio = window.devicePixelRatio || 1
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.save()
      context.scale(pixelRatio, pixelRatio)

      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = timestamp - spark.startTime
        if (elapsed >= duration) return false

        const progress = elapsed / duration
        const eased = easeFunc(progress)
        const distance = eased * sparkRadius * extraScale
        const lineLength = sparkSize * (1 - eased)
        const x1 = spark.x + distance * Math.cos(spark.angle)
        const y1 = spark.y + distance * Math.sin(spark.angle)
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle)
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle)

        context.strokeStyle = sparkColor
        context.lineWidth = 2
        context.beginPath()
        context.moveTo(x1, y1)
        context.lineTo(x2, y2)
        context.stroke()

        return true
      })

      context.restore()
      animationId = requestAnimationFrame(draw)
    }

    animationId = requestAnimationFrame(draw)

    return () => cancelAnimationFrame(animationId)
  }, [sparkColor, sparkSize, sparkRadius, sparkCount, duration, easeFunc, extraScale])

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const now = performance.now()
    const newSparks = Array.from({ length: sparkCount }, (_, index) => ({
      x,
      y,
      angle: (2 * Math.PI * index) / sparkCount,
      startTime: now,
    }))

    sparksRef.current.push(...newSparks)
  }

  return (
    <div className="click-spark" onClick={handleClick}>
      <canvas aria-hidden="true" className="click-spark-canvas" ref={canvasRef} />
      {children}
    </div>
  )
}

export default ClickSpark
