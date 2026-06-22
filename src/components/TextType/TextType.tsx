import { createElement, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react'
import './TextType.css'

interface TextTypeProps extends HTMLAttributes<HTMLElement> {
  className?: string
  showCursor?: boolean
  hideCursorWhileTyping?: boolean
  cursorCharacter?: string | ReactNode
  cursorBlinkDuration?: number
  cursorClassName?: string
  text?: string | string[]
  texts?: string[]
  as?: ElementType
  typingSpeed?: number
  initialDelay?: number
  pauseDuration?: number
  deletingSpeed?: number
  loop?: boolean
  textColors?: string[]
  variableSpeed?: { min: number; max: number }
  variableSpeedEnabled?: boolean
  variableSpeedMin?: number
  variableSpeedMax?: number
  onSentenceComplete?: (sentence: string, index: number) => void
  startOnVisible?: boolean
  reverseMode?: boolean
}

export default function TextType({
  text,
  texts,
  as: Component = 'span',
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = '',
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = '|',
  cursorClassName = '',
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  variableSpeedEnabled = false,
  variableSpeedMin = 60,
  variableSpeedMax = 120,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}: TextTypeProps) {
  const textArray = useMemo(() => {
    const source = texts ?? text ?? ''
    return Array.isArray(source) ? source : [source]
  }, [text, texts])
  const [displayedText, setDisplayedText] = useState('')
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)
  const containerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return undefined

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.1 },
    )

    observer.observe(containerRef.current)

    return () => observer.disconnect()
  }, [startOnVisible])

  useEffect(() => {
    if (!isVisible || textArray.length === 0) return undefined

    let timeout: number
    const currentText = textArray[currentTextIndex] ?? ''
    const processedText = reverseMode
      ? Array.from(currentText).reverse().join('')
      : currentText
    const speed =
      variableSpeed || variableSpeedEnabled
        ? Math.random() *
            ((variableSpeed?.max ?? variableSpeedMax) -
              (variableSpeed?.min ?? variableSpeedMin)) +
          (variableSpeed?.min ?? variableSpeedMin)
        : typingSpeed

    if (isDeleting) {
      if (displayedText === '') {
        setIsDeleting(false)
        onSentenceComplete?.(currentText, currentTextIndex)

        if (currentTextIndex === textArray.length - 1 && !loop) {
          return undefined
        }

        setCurrentTextIndex((current) => (current + 1) % textArray.length)
        setCurrentCharIndex(0)
      } else {
        timeout = window.setTimeout(() => {
          setDisplayedText((current) => current.slice(0, -1))
        }, deletingSpeed)
      }
    } else if (currentCharIndex < processedText.length) {
      timeout = window.setTimeout(
        () => {
          setDisplayedText((current) => current + processedText[currentCharIndex])
          setCurrentCharIndex((current) => current + 1)
        },
        currentCharIndex === 0 && displayedText === '' ? initialDelay + speed : speed,
      )
    } else if (loop || currentTextIndex < textArray.length - 1) {
      timeout = window.setTimeout(() => {
        setIsDeleting(true)
      }, pauseDuration)
    }

    return () => window.clearTimeout(timeout)
  }, [
    currentCharIndex,
    currentTextIndex,
    deletingSpeed,
    displayedText,
    initialDelay,
    isDeleting,
    isVisible,
    loop,
    onSentenceComplete,
    pauseDuration,
    reverseMode,
    textArray,
    typingSpeed,
    variableSpeed,
    variableSpeedEnabled,
    variableSpeedMax,
    variableSpeedMin,
  ])

  const currentText = textArray[currentTextIndex] ?? ''
  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < currentText.length || isDeleting)
  const color = textColors.length
    ? textColors[currentTextIndex % textColors.length]
    : undefined

  return createElement(
    Component,
    {
      ...props,
      ref: containerRef,
      className: ['text-type', className].filter(Boolean).join(' '),
      style: {
        ...(props.style as CSSProperties | undefined),
        '--cursor-blink-duration': `${cursorBlinkDuration}s`,
      } as CSSProperties,
    },
    createElement(
      'span',
      {
        className: 'text-type__content',
        style: { color: color ?? 'inherit' },
      },
      displayedText,
    ),
    showCursor &&
      createElement(
        'span',
        {
          className: [
            'text-type__cursor',
            cursorClassName,
            shouldHideCursor ? 'text-type__cursor--hidden' : '',
          ]
            .filter(Boolean)
            .join(' '),
        },
        cursorCharacter,
      ),
  )
}
