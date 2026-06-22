import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { FC, PointerEvent } from 'react'
import './CurvedLoop.css'

interface CurvedLoopProps {
  marqueeText?: string
  speed?: number
  className?: string
  curveAmount?: number
  pathVariant?: 'arc' | 'circle' | 'wave'
  direction?: 'left' | 'right'
  interactive?: boolean
}

const CurvedLoop: FC<CurvedLoopProps> = ({
  marqueeText = '',
  speed = 2,
  className,
  curveAmount = 400,
  pathVariant = 'arc',
  direction = 'left',
  interactive = true,
}) => {
  const text = useMemo(() => {
    const hasTrailing = /\s|\u00A0$/.test(marqueeText)
    return `${hasTrailing ? marqueeText.replace(/\s+$/, '') : marqueeText}\u00A0`
  }, [marqueeText])

  const measureRef = useRef<SVGTextElement | null>(null)
  const textPathRef = useRef<SVGTextPathElement | null>(null)
  const [spacing, setSpacing] = useState(0)
  const [offset, setOffset] = useState(0)
  const uid = useId().replace(/:/g, '')
  const pathId = `curve-${uid}`
  const curveDepth = Math.abs(curveAmount)
  const viewBox =
    pathVariant === 'wave' ? '-320 0 2080 620' : '-2100 0 6000 1960'
  const pathD =
    pathVariant === 'wave'
      ? 'M-320,130 C-80,325 160,425 420,438 C625,448 730,384 900,392 C1080,402 1240,372 1410,250 C1550,150 1650,92 1760,54'
      : pathVariant === 'circle'
      ? 'M-2100,980 a3000,760 0 1,0 6000,0 a3000,760 0 1,0 -6000,0'
      : curveAmount >= 0
        ? `M-180,345 Q540,${345 + curveDepth * 0.45} 1620,40`
        : `M-180,40 Q540,${40 - curveDepth * 0.45} 1620,345`
  const dragRef = useRef(false)
  const lastXRef = useRef(0)
  const dirRef = useRef<'left' | 'right'>(direction)
  const velocityRef = useRef(0)
  const ready = spacing > 0
  const totalText = spacing
    ? Array(Math.ceil(3600 / spacing) + 5)
        .fill(text)
        .join('')
    : text

  useEffect(() => {
    if (measureRef.current) {
      setSpacing(measureRef.current.getComputedTextLength())
    }
  }, [text, className])

  useEffect(() => {
    if (!spacing || !textPathRef.current) return

    const initial = -spacing
    textPathRef.current.setAttribute('startOffset', `${initial}px`)
    setOffset(initial)
  }, [spacing])

  useEffect(() => {
    dirRef.current = direction
  }, [direction])

  useEffect(() => {
    if (!spacing || !ready) return undefined

    let frame = 0

    const step = () => {
      if (!dragRef.current && textPathRef.current) {
        const delta = dirRef.current === 'right' ? speed : -speed
        const currentOffset = Number.parseFloat(
          textPathRef.current.getAttribute('startOffset') || '0',
        )
        let newOffset = currentOffset + delta

        if (newOffset <= -spacing) newOffset += spacing
        if (newOffset > 0) newOffset -= spacing

        textPathRef.current.setAttribute('startOffset', `${newOffset}px`)
        setOffset(newOffset)
      }

      frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [spacing, speed, ready])

  const onPointerDown = (event: PointerEvent) => {
    if (!interactive) return

    dragRef.current = true
    lastXRef.current = event.clientX
    velocityRef.current = 0
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: PointerEvent) => {
    if (!interactive || !dragRef.current || !textPathRef.current) return

    const dx = event.clientX - lastXRef.current
    lastXRef.current = event.clientX
    velocityRef.current = dx
    const currentOffset = Number.parseFloat(
      textPathRef.current.getAttribute('startOffset') || '0',
    )
    let newOffset = currentOffset + dx

    if (newOffset <= -spacing) newOffset += spacing
    if (newOffset > 0) newOffset -= spacing

    textPathRef.current.setAttribute('startOffset', `${newOffset}px`)
    setOffset(newOffset)
  }

  const endDrag = () => {
    if (!interactive) return

    dragRef.current = false
    dirRef.current = velocityRef.current > 0 ? 'right' : 'left'
  }

  return (
    <div
      className="curved-loop-jacket"
      onPointerDown={onPointerDown}
      onPointerLeave={endDrag}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      style={{
        cursor: interactive ? (dragRef.current ? 'grabbing' : 'grab') : 'auto',
        visibility: ready ? 'visible' : 'hidden',
      }}
    >
      <svg className="curved-loop-svg" viewBox={viewBox}>
        <text
          ref={measureRef}
          style={{ opacity: 0, pointerEvents: 'none', visibility: 'hidden' }}
          xmlSpace="preserve"
        >
          {text}
        </text>
        <defs>
          <path d={pathD} fill="none" id={pathId} stroke="transparent" />
        </defs>
        {ready ? (
          <text className={className} fontWeight="bold" xmlSpace="preserve">
            <textPath
              href={`#${pathId}`}
              ref={textPathRef}
              startOffset={`${offset}px`}
              xmlSpace="preserve"
            >
              {totalText}
            </textPath>
          </text>
        ) : null}
      </svg>
    </div>
  )
}

export default CurvedLoop
