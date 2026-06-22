import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import './TrueFocus.css'

interface TrueFocusProps {
  sentence?: string
  separator?: string
  manualMode?: boolean
  blurAmount?: number
  borderColor?: string
  glowColor?: string
  animationDuration?: number
  pauseBetweenAnimations?: number
  fullFocusPause?: number
  sweepCount?: number
}

interface FocusRect {
  x: number
  y: number
  width: number
  height: number
}

function TrueFocus({
  sentence = 'True Focus',
  separator = ' ',
  manualMode = false,
  blurAmount = 5,
  borderColor = '#1ee66f',
  glowColor = 'rgba(30, 230, 111, 0.55)',
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
  fullFocusPause = 0.5,
  sweepCount = 3,
}: TrueFocusProps) {
  const words = sentence.split(separator)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [focusRect, setFocusRect] = useState<FocusRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  })
  const fullFocusIndex = -1
  const sweepLength = words.length * sweepCount

  useEffect(() => {
    if (manualMode) return undefined

    const isFullFocus = currentIndex === fullFocusIndex
    const duration = isFullFocus
      ? animationDuration + fullFocusPause
      : animationDuration + pauseBetweenAnimations

    const timeout = window.setTimeout(() => {
      setCurrentIndex((previous) => {
        if (previous === fullFocusIndex) return 0
        if (previous >= sweepLength - 1) return fullFocusIndex
        return previous + 1
      })
    }, duration * 1000)

    return () => window.clearTimeout(timeout)
  }, [
    manualMode,
    animationDuration,
    pauseBetweenAnimations,
    fullFocusPause,
    currentIndex,
    fullFocusIndex,
    sweepLength,
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const parentRect = container.getBoundingClientRect()

    if (currentIndex === fullFocusIndex) {
      const wordRects = wordRefs.current
        .filter((word): word is HTMLSpanElement => Boolean(word))
        .map((word) => word.getBoundingClientRect())

      if (!wordRects.length) return

      const left = Math.min(...wordRects.map((rect) => rect.left))
      const top = Math.min(...wordRects.map((rect) => rect.top))
      const right = Math.max(...wordRects.map((rect) => rect.right))
      const bottom = Math.max(...wordRects.map((rect) => rect.bottom))

      setFocusRect({
        x: left - parentRect.left,
        y: top - parentRect.top,
        width: right - left,
        height: bottom - top,
      })
      return
    }

    const activeWord = wordRefs.current[currentIndex % words.length]
    if (!activeWord) return

    const activeRect = activeWord.getBoundingClientRect()

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    })
  }, [currentIndex, words.length])

  const handleMouseEnter = (index: number) => {
    if (!manualMode) return

    setLastActiveIndex(index)
    setCurrentIndex(index)
  }

  const handleMouseLeave = () => {
    if (manualMode) setCurrentIndex(lastActiveIndex ?? 0)
  }

  return (
    <div className="focus-container" ref={containerRef}>
      {words.map((word, index) => {
        const isActive =
          currentIndex === fullFocusIndex || index === currentIndex % words.length

        return (
          <span
            className={`focus-word ${manualMode ? 'manual' : ''} ${
              isActive && !manualMode ? 'active' : ''
            }`}
            key={`${word}-${index}`}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
            ref={(element) => {
              wordRefs.current[index] = element
            }}
            style={
              {
                filter: isActive ? 'blur(0px)' : `blur(${blurAmount}px)`,
                transition: `filter ${animationDuration}s ease, color ${animationDuration}s ease`,
                '--border-color': borderColor,
                '--glow-color': glowColor,
              } as React.CSSProperties
            }
          >
            {word}
          </span>
        )
      })}

      <motion.div
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: 1,
        }}
        className="focus-frame"
        style={
          {
            '--border-color': borderColor,
            '--glow-color': glowColor,
          } as React.CSSProperties
        }
        transition={{ duration: animationDuration }}
      >
        <span className="corner top-left" />
        <span className="corner top-right" />
        <span className="corner bottom-left" />
        <span className="corner bottom-right" />
      </motion.div>
    </div>
  )
}

export default TrueFocus
