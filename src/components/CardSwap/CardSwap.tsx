import {
  Children,
  cloneElement,
  createRef,
  forwardRef,
  isValidElement,
  useEffect,
  useMemo,
  useRef,
} from 'react'
import type {
  HTMLAttributes,
  ReactElement,
  ReactNode,
  RefAttributes,
  RefObject,
} from 'react'
import gsap from 'gsap'
import './CardSwap.css'

export interface CardSwapProps {
  width?: number | string
  height?: number | string
  cardDistance?: number
  verticalDistance?: number
  delay?: number
  pauseOnHover?: boolean
  onCardClick?: (idx: number) => void
  skewAmount?: number
  easing?: 'linear' | 'elastic'
  children: ReactNode
}

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  customClass?: string
}

interface Slot {
  x: number
  y: number
  z: number
  zIndex: number
}

type CardRef = RefObject<HTMLDivElement | null>

const makeSlot = (
  index: number,
  distanceX: number,
  distanceY: number,
  total: number,
): Slot => ({
  x: index * distanceX,
  y: -index * distanceY,
  z: -index * distanceX * 1.5,
  zIndex: total - index,
})

const placeNow = (element: HTMLElement, slot: Slot, skew: number) =>
  gsap.set(element, {
    x: slot.x,
    y: slot.y,
    z: slot.z,
    xPercent: -50,
    yPercent: -50,
    skewY: skew,
    transformOrigin: 'center center',
    zIndex: slot.zIndex,
    force3D: true,
  })

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ customClass, ...rest }, ref) => (
    <div
      ref={ref}
      {...rest}
      className={`card ${customClass ?? ''} ${rest.className ?? ''}`.trim()}
    />
  ),
)

Card.displayName = 'Card'

function CardSwap({
  width = 500,
  height = 400,
  cardDistance = 60,
  verticalDistance = 70,
  delay = 5000,
  pauseOnHover = false,
  onCardClick,
  skewAmount = 6,
  easing = 'elastic',
  children,
}: CardSwapProps) {
  const config =
    easing === 'elastic'
      ? {
          ease: 'elastic.out(0.6,0.9)',
          durDrop: 2,
          durMove: 2,
          durReturn: 2,
          promoteOverlap: 0.9,
          returnDelay: 0.05,
        }
      : {
          ease: 'power1.inOut',
          durDrop: 0.8,
          durMove: 0.8,
          durReturn: 0.8,
          promoteOverlap: 0.45,
          returnDelay: 0.2,
        }

  const childArr = useMemo(
    () => Children.toArray(children) as ReactElement<CardProps>[],
    [children],
  )
  const refs = useMemo<CardRef[]>(
    () => childArr.map(() => createRef<HTMLDivElement>()),
    [childArr.length],
  )
  const order = useRef<number[]>(Array.from({ length: childArr.length }, (_, i) => i))
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const intervalRef = useRef<number | undefined>(undefined)
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const total = refs.length

    refs.forEach((ref, index) => {
      if (ref.current) {
        placeNow(ref.current, makeSlot(index, cardDistance, verticalDistance, total), skewAmount)
      }
    })

    const swap = () => {
      if (order.current.length < 2) return

      const [front, ...rest] = order.current
      const frontElement = refs[front].current
      if (!frontElement) return

      const timeline = gsap.timeline()
      timelineRef.current = timeline

      timeline.to(frontElement, {
        y: '+=500',
        duration: config.durDrop,
        ease: config.ease,
      })

      timeline.addLabel('promote', `-=${config.durDrop * config.promoteOverlap}`)
      rest.forEach((index, position) => {
        const element = refs[index].current
        if (!element) return

        const slot = makeSlot(position, cardDistance, verticalDistance, refs.length)
        timeline.set(element, { zIndex: slot.zIndex }, 'promote')
        timeline.to(
          element,
          {
            x: slot.x,
            y: slot.y,
            z: slot.z,
            duration: config.durMove,
            ease: config.ease,
          },
          `promote+=${position * 0.15}`,
        )
      })

      const backSlot = makeSlot(refs.length - 1, cardDistance, verticalDistance, refs.length)
      timeline.addLabel('return', `promote+=${config.durMove * config.returnDelay}`)
      timeline.call(
        () => {
          gsap.set(frontElement, { zIndex: backSlot.zIndex })
        },
        undefined,
        'return',
      )
      timeline.to(
        frontElement,
        {
          x: backSlot.x,
          y: backSlot.y,
          z: backSlot.z,
          duration: config.durReturn,
          ease: config.ease,
        },
        'return',
      )

      timeline.call(() => {
        order.current = [...rest, front]
      })
    }

    swap()
    intervalRef.current = window.setInterval(swap, delay)

    if (!pauseOnHover) {
      return () => {
        window.clearInterval(intervalRef.current)
        timelineRef.current?.kill()
      }
    }

    const node = container.current
    if (!node) return undefined

    const pause = () => {
      timelineRef.current?.pause()
      window.clearInterval(intervalRef.current)
    }
    const resume = () => {
      timelineRef.current?.play()
      intervalRef.current = window.setInterval(swap, delay)
    }

    node.addEventListener('mouseenter', pause)
    node.addEventListener('mouseleave', resume)

    return () => {
      node.removeEventListener('mouseenter', pause)
      node.removeEventListener('mouseleave', resume)
      window.clearInterval(intervalRef.current)
      timelineRef.current?.kill()
    }
  }, [
    cardDistance,
    verticalDistance,
    delay,
    pauseOnHover,
    skewAmount,
    easing,
    refs,
    config.durDrop,
    config.durMove,
    config.durReturn,
    config.ease,
    config.promoteOverlap,
    config.returnDelay,
  ])

  const rendered = childArr.map((child, index) =>
    isValidElement<CardProps>(child)
      ? cloneElement(child, {
          key: index,
          ref: refs[index],
          style: { width, height, ...(child.props.style ?? {}) },
          onClick: (event) => {
            child.props.onClick?.(event)
            onCardClick?.(index)
          },
        } as CardProps & RefAttributes<HTMLDivElement>)
      : child,
  )

  return (
    <div className="card-swap-container" ref={container} style={{ width, height }}>
      {rendered}
    </div>
  )
}

export default CardSwap
