import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import { gsap } from 'gsap'
import './PillNav.css'

export type PillNavItem = {
  label: string
  href: string
  ariaLabel?: string
  dropdown?: Array<{
    title: string
    href?: string
    icon: ReactNode
  }>
}

type PillNavProps = {
  logo?: string
  logoAlt?: string
  logoHref?: string
  brandLabel?: string
  items: PillNavItem[]
  activeHref?: string
  className?: string
  ease?: string
  baseColor?: string
  pillColor?: string
  hoveredPillTextColor?: string
  pillTextColor?: string
  initialLoadAnimation?: boolean
  linksOnly?: boolean
}

function PillNav({
  logo,
  logoAlt = 'Kitchain Logo',
  logoHref = '#top',
  brandLabel,
  items,
  activeHref,
  className = '',
  ease = 'power3.easeOut',
  baseColor = '#0a0d0b',
  pillColor = '#ffffff',
  hoveredPillTextColor = '#ffffff',
  pillTextColor,
  initialLoadAnimation = false,
  linksOnly = false,
}: PillNavProps) {
  const resolvedPillTextColor = pillTextColor ?? baseColor
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([])
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([])
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([])
  const logoImgRef = useRef<HTMLImageElement | null>(null)
  const logoTweenRef = useRef<gsap.core.Tween | null>(null)
  const hamburgerRef = useRef<HTMLButtonElement | null>(null)
  const mobileMenuRef = useRef<HTMLDivElement | null>(null)
  const navItemsRef = useRef<HTMLDivElement | null>(null)
  const logoRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return

        const pill = circle.parentElement as HTMLElement
        const { width: w, height: h } = pill.getBoundingClientRect()
        const radius = ((w * w) / 4 + h * h) / (2 * h)
        const diameter = Math.ceil(2 * radius) + 2
        const delta =
          Math.ceil(radius - Math.sqrt(Math.max(0, radius * radius - (w * w) / 4))) + 1
        const originY = diameter - delta

        circle.style.width = `${diameter}px`
        circle.style.height = `${diameter}px`
        circle.style.bottom = `-${delta}px`

        gsap.set(circle, {
          xPercent: -50,
          scale: 0,
          transformOrigin: `50% ${originY}px`,
        })

        const label = pill.querySelector<HTMLElement>('.pill-label')
        const hoverLabel = pill.querySelector<HTMLElement>('.pill-label-hover')

        if (label) gsap.set(label, { y: 0 })
        if (hoverLabel) gsap.set(hoverLabel, { y: h + 12, opacity: 0 })

        tlRefs.current[index]?.kill()
        const tl = gsap.timeline({ paused: true })

        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: 'auto' }, 0)

        if (label) {
          tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: 'auto' }, 0)
        }

        if (hoverLabel) {
          gsap.set(hoverLabel, { y: Math.ceil(h + 100), opacity: 0 })
          tl.to(hoverLabel, { y: 0, opacity: 1, duration: 2, ease, overwrite: 'auto' }, 0)
        }

        tlRefs.current[index] = tl
      })
    }

    layout()

    const onResize = () => layout()
    window.addEventListener('resize', onResize)

    document.fonts?.ready.then(layout).catch(() => {})

    if (mobileMenuRef.current) {
      gsap.set(mobileMenuRef.current, { visibility: 'hidden', opacity: 0, y: 10 })
    }

    if (initialLoadAnimation) {
      if (logoRef.current) {
        gsap.fromTo(logoRef.current, { scale: 0.96, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.45, ease })
      }

      if (navItemsRef.current) {
        gsap.fromTo(navItemsRef.current, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.45, ease })
      }
    }

    return () => {
      window.removeEventListener('resize', onResize)
      tlRefs.current.forEach((timeline) => timeline?.kill())
      activeTweenRefs.current.forEach((tween) => tween?.kill())
      logoTweenRef.current?.kill()
    }
  }, [items, ease, initialLoadAnimation])

  const handleEnter = (index: number) => {
    const tl = tlRefs.current[index]
    if (!tl) return

    activeTweenRefs.current[index]?.kill()
    activeTweenRefs.current[index] = tl.tweenTo(tl.duration(), {
      duration: 0.3,
      ease,
      overwrite: 'auto',
    })
  }

  const handleLeave = (index: number) => {
    const tl = tlRefs.current[index]
    if (!tl) return

    activeTweenRefs.current[index]?.kill()
    activeTweenRefs.current[index] = tl.tweenTo(0, {
      duration: 0.2,
      ease,
      overwrite: 'auto',
    })
  }

  const handleLogoEnter = () => {
    if (!logoImgRef.current) return

    logoTweenRef.current?.kill()
    gsap.set(logoImgRef.current, { rotate: 0 })
    logoTweenRef.current = gsap.to(logoImgRef.current, {
      rotate: 360,
      duration: 0.38,
      ease,
      overwrite: 'auto',
    })
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
    const lines = hamburgerRef.current?.querySelectorAll('.hamburger-line')

    if (lines?.length) {
      gsap.to(lines[0], { rotation: 0, y: 0, duration: 0.25, ease })
      gsap.to(lines[1], { rotation: 0, y: 0, duration: 0.25, ease })
    }

    if (mobileMenuRef.current) {
      gsap.to(mobileMenuRef.current, {
        opacity: 0,
        y: 10,
        duration: 0.22,
        ease,
        onComplete: () => {
          gsap.set(mobileMenuRef.current, { visibility: 'hidden' })
        },
      })
    }
  }

  const toggleMobileMenu = () => {
    const nextOpen = !isMobileMenuOpen
    setIsMobileMenuOpen(nextOpen)
    const lines = hamburgerRef.current?.querySelectorAll('.hamburger-line')

    if (lines?.length) {
      gsap.to(lines[0], { rotation: nextOpen ? 45 : 0, y: nextOpen ? 3 : 0, duration: 0.25, ease })
      gsap.to(lines[1], { rotation: nextOpen ? -45 : 0, y: nextOpen ? -3 : 0, duration: 0.25, ease })
    }

    if (!mobileMenuRef.current) return

    if (nextOpen) {
      gsap.set(mobileMenuRef.current, { visibility: 'visible' })
      gsap.fromTo(
        mobileMenuRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.28, ease },
      )
    } else {
      closeMobileMenu()
    }
  }

  const handleMobileLinkClick = (event: MouseEvent<HTMLAnchorElement>) => {
    closeMobileMenu()

    const href = event.currentTarget.getAttribute('href')
    if (href?.startsWith('#')) {
      event.preventDefault()
      document.querySelector(href)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const cssVars = {
    '--base': baseColor,
    '--pill-bg': pillColor,
    '--hover-text': hoveredPillTextColor,
    '--pill-text': resolvedPillTextColor,
  } as CSSProperties

  const navList = (
    <div className="pill-nav-items desktop-only" ref={navItemsRef}>
      <ul className="pill-list" role="menubar">
        {items.map((item, index) => (
          <li
            className={`pill-item${item.dropdown?.length ? ' has-dropdown' : ''}`}
            key={`${item.label}-${item.href}`}
            role="none"
          >
            <a
              role="menuitem"
              href={item.href}
              className={`pill${activeHref === item.href ? ' is-active' : ''}`}
              aria-label={item.ariaLabel || item.label}
              onMouseEnter={() => handleEnter(index)}
              onMouseLeave={() => handleLeave(index)}
            >
              <span
                className="hover-circle"
                aria-hidden="true"
                ref={(el) => {
                  circleRefs.current[index] = el
                }}
              />
              <span className="label-stack">
                <span className="pill-label">{item.label}</span>
                <span className="pill-label-hover" aria-hidden="true">
                  {item.label}
                </span>
              </span>
            </a>
            {item.dropdown?.length ? (
              <div
                className={`pill-dropdown${item.dropdown.length <= 3 ? ' compact' : ''}`}
                role="menu"
                aria-label={`${item.label} options`}
              >
                <div className="pill-dropdown-grid">
                  {item.dropdown.map((dropdownItem) => (
                    <a
                      className="pill-dropdown-card"
                      href={dropdownItem.href ?? item.href}
                      key={dropdownItem.title}
                      role="menuitem"
                    >
                      <span className="pill-dropdown-icon" aria-hidden="true">
                        {dropdownItem.icon}
                      </span>
                      <span>{dropdownItem.title}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )

  if (linksOnly) {
    return (
      <div
        className={`pill-nav-links-only ${className}`}
        aria-label="Primary navigation"
        style={cssVars}
      >
        {navList}
      </div>
    )
  }

  return (
    <div className="pill-nav-container">
      <nav className={`pill-nav ${className}`} aria-label="Primary" style={cssVars}>
        {logo ? (
          <a
            className="pill-logo"
            href={logoHref}
            aria-label="Kitchain home"
            onMouseEnter={handleLogoEnter}
            ref={logoRef}
          >
            <img src={logo} alt={logoAlt} ref={logoImgRef} />
            {brandLabel ? <span>{brandLabel}</span> : null}
          </a>
        ) : null}

        {navList}

        <button
          className="mobile-menu-button mobile-only"
          type="button"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
          aria-expanded={isMobileMenuOpen}
          ref={hamburgerRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div className="mobile-menu-popover mobile-only" ref={mobileMenuRef} style={cssVars}>
        <ul className="mobile-menu-list">
          {items.map((item) => (
            <li key={`mobile-${item.label}-${item.href}`}>
              <a
                href={item.href}
                className={`mobile-menu-link${activeHref === item.href ? ' is-active' : ''}`}
                onClick={handleMobileLinkClick}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PillNav
