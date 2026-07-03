import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent } from 'react'
import {
  BookOpenText,
  ChartNoAxesColumnIncreasing,
  ClipboardCheck,
  Handshake,
  Megaphone,
  MessageSquareText,
  Sparkles,
  Tickets,
  UsersRound,
} from 'lucide-react'
import CardSwap, { Card } from './components/CardSwap/CardSwap'
import ClickSpark from './components/ClickSpark/ClickSpark'
import CurvedLoop from './components/CurvedLoop/CurvedLoop'
import Lanyard from './components/Lanyard/Lanyard'
import PillNav from './components/PillNav/PillNav'
import TextType from './components/TextType/TextType'
import TrueFocus from './components/TrueFocus/TrueFocus'
import './App.css'

const publicAsset = (path: string) => `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`

const capabilityTabs = ['提问', '诊断', '执行', '复盘']
const heroTitleOptions = [
  ['让', '餐饮', '更简单'],
  ['让', '老板', '更轻松'],
]

const connectorText = 'KITCHAIN ✦ AI ✦ LABOR ✦ AS ✦ SERVICE ✦'

const primaryNavItems = [
  {
    label: '产品',
    href: '#product',
    dropdown: [
      { title: '诊断你的餐厅', icon: <ClipboardCheck size={20} strokeWidth={2.2} /> },
      { title: '管理你的评论', icon: <MessageSquareText size={20} strokeWidth={2.2} /> },
      { title: '美化你的菜单', icon: <Sparkles size={20} strokeWidth={2.2} /> },
      { title: '设置你的团购', icon: <Tickets size={20} strokeWidth={2.2} /> },
      { title: '推出新的活动', icon: <Megaphone size={20} strokeWidth={2.2} /> },
      { title: '跟踪后续数据', icon: <ChartNoAxesColumnIncreasing size={20} strokeWidth={2.2} /> },
    ],
  },
  { label: '定价', href: '#pricing' },
  { label: '我们怎么做', href: '#workflow' },
  {
    label: '关于',
    href: '#about',
    dropdown: [
      { title: '我们的故事', icon: <BookOpenText size={20} strokeWidth={2.2} /> },
      { title: '领导', icon: <UsersRound size={20} strokeWidth={2.2} /> },
      { title: '合作者', icon: <Handshake size={20} strokeWidth={2.2} /> },
    ],
  },
]

const capabilityCards = [
  {
    title: '餐厅经营诊断',
    body: '聚合门店信息、评价、菜单、竞品与本地搜索表现，生成清晰问题列表。',
    media: publicAsset('/capability-question.mp4'),
  },
  {
    title: '营销任务执行',
    body: '把诊断结果转成可执行任务，包含活动建议、渠道动作和文案草稿。',
    media: publicAsset('/capability-diagnosis.mp4'),
  },
  {
    title: '数据看板追踪',
    body: '持续记录曝光、评价、转化和复购信号，让老板看到每一步变化。',
    media: publicAsset('/capability-execution.mp4'),
  },
  {
    title: '增长机会发现',
    body: '自动识别高优先级机会，帮助门店决定先做什么、为什么做。',
    media: publicAsset('/capability-review.mp4'),
  },
]

const caseShowcaseItems = [
  { id: 'lujian-xiaoguan', img: publicAsset('/case-dome-lujian-xiaoguan.png'), height: 760 },
  { id: 'wanyan', img: publicAsset('/case-masonry-wanyan.jpg'), height: 620 },
  { id: 'dianniu', img: publicAsset('/case-dome-dianniu.png'), height: 720 },
  { id: 'benlai-chuancai', img: publicAsset('/case-dome-benlai-chuancai.png'), height: 690 },
  { id: 'asan-zhexian', img: publicAsset('/case-dome-asan-zhexian.png'), height: 700 },
  { id: 'yunaman', img: publicAsset('/case-dome-yunaman.png'), height: 680 },
  { id: 'yudonglan', img: publicAsset('/case-dome-yudonglan.png'), height: 700 },
  { id: 'dongfadao', img: publicAsset('/case-dome-dongfadao.png'), height: 660 },
  { id: 'pincui-huiyuan', img: publicAsset('/case-dome-pincui-huiyuan.png'), height: 720 },
  { id: 'chuanshiduo', img: publicAsset('/case-dome-chuanshiduo.png'), height: 690 },
  { id: 'rongxiansen', img: publicAsset('/case-dome-rongxiansen.png'), height: 650 },
  { id: 'siji-fandian', img: publicAsset('/case-dome-siji-fandian.png'), height: 690 },
  { id: 'gaoxing-yiguo', img: publicAsset('/case-dome-gaoxing-yiguo.png'), height: 620 },
  { id: 'haoren-xiaochi', img: publicAsset('/case-dome-haoren-xiaochi.png'), height: 640 },
  { id: 'yuyao-haixian', img: publicAsset('/case-dome-yuyao-haixian.png'), height: 660 },
]

const caseShowcaseRows = [
  caseShowcaseItems.slice(0, 8),
  caseShowcaseItems.slice(8),
]

const officialCards = [
  {
    title: '公众号',
    body: '发布产品更新、餐饮经营方法和深度案例。',
  },
  {
    title: '视频号',
    body: '用短视频展示真实门店从诊断到执行的过程。',
  },
  {
    title: '小红书',
    body: '沉淀餐饮老板能直接使用的营销灵感和模板。',
  },
  {
    title: '抖音',
    body: '用短视频展现展示我们的产品功能更新、真实的使用案例',
  },
]

const videoCards = [
  { title: '完整工作流演示', orientation: 'wide', media: publicAsset('/sixth-section-animation-1.mp4') },
  {
    title: '老板端快速输入',
    orientation: 'vertical',
    media: publicAsset('/sixth-section-animation-2.mp4'),
    caption: '提升餐厅在榜单中的位置，\n效果你能看见。',
  },
  {
    title: '报告生成过程',
    orientation: 'vertical',
    media: publicAsset('/sixth-section-animation-3-current.mp4'),
    caption: 'AI全执行，省时省力就是省钱。',
    captionColor: '#0a0d0b',
  },
]

function App() {
  const [restaurantName, setRestaurantName] = useState('输入你的店名')
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeCapability, setActiveCapability] = useState(0)
  const [isCapabilityPaused, setIsCapabilityPaused] = useState(false)
  const [activeHeroTitle, setActiveHeroTitle] = useState(0)
  const [loopSpeed, setLoopSpeed] = useState(1)
  const capabilityTimerRef = useRef<number | undefined>(undefined)
  const loopSpeedTimerRef = useRef<number | undefined>(undefined)
  const loopSpeedRef = useRef(1)
  const caseTrackRefs = useRef<Array<HTMLDivElement | null>>([])
  const caseProgressRef = useRef([0, 0])
  const caseFrameRef = useRef<number | undefined>(undefined)
  const casePointerSpeedRef = useRef(1)
  const casePointerSpeedTimerRef = useRef<number | undefined>(undefined)
  const capabilitiesSectionRef = useRef<HTMLElement>(null)
  const heroTransitionRef = useRef<HTMLDivElement>(null)
  const restaurantFormRef = useRef<HTMLFormElement>(null)
  const restaurantFormSlotRef = useRef<HTMLDivElement>(null)
  const capabilityVideoRef = useRef<HTMLVideoElement>(null)
  const workflowVideoRef = useRef<HTMLVideoElement>(null)
  const activeCapabilityLeft = `${(activeCapability + 0.5) * 25}%`

  const scheduleNextCapability = (delay = 2000) => {
    window.clearTimeout(capabilityTimerRef.current)
    capabilityTimerRef.current = window.setTimeout(() => {
      setActiveCapability((current) => (current + 1) % capabilityTabs.length)
    }, delay)
  }

  useEffect(() => {
    window.clearTimeout(capabilityTimerRef.current)
    if (isCapabilityPaused) return undefined

    const card = capabilityCards[activeCapability]
    const video = capabilityVideoRef.current

    const moveNext = () => {
      setActiveCapability((current) => (current + 1) % capabilityTabs.length)
    }

    if (!card.media || !video) {
      capabilityTimerRef.current = window.setTimeout(moveNext, 4800)
      return () => window.clearTimeout(capabilityTimerRef.current)
    }

    let isDisposed = false

    const playVideo = () => {
      if (isDisposed) return
      video.controls = false
      video.muted = true
      video.currentTime = 0
      void video.play().catch(() => undefined)
    }

    const scheduleByDuration = () => {
      if (isDisposed) return
      const duration = Number.isFinite(video.duration) && video.duration > 0
        ? video.duration * 1000
        : 5200
      window.clearTimeout(capabilityTimerRef.current)
      capabilityTimerRef.current = window.setTimeout(moveNext, duration + 2000)
    }

    const start = () => {
      playVideo()
      scheduleByDuration()
    }

    const resumeWhenVisible = () => {
      if (document.visibilityState === 'visible' && !isCapabilityPaused && video.paused) {
        void video.play().catch(() => undefined)
      }
    }

    if (video.readyState >= 1) {
      start()
    } else {
      video.addEventListener('loadedmetadata', start, { once: true })
    }

    document.addEventListener('visibilitychange', resumeWhenVisible)

    return () => {
      isDisposed = true
      video.removeEventListener('loadedmetadata', start)
      document.removeEventListener('visibilitychange', resumeWhenVisible)
      window.clearTimeout(capabilityTimerRef.current)
    }
  }, [activeCapability, isCapabilityPaused])

  useEffect(() => {
    let frame = 0

    const clamp = (value: number) => Math.min(Math.max(value, 0), 1)
    const interpolate = (from: number, to: number, progress: number) =>
      from + (to - from) * progress

    const updateTransition = () => {
      frame = 0
      const shell = heroTransitionRef.current
      const slot = restaurantFormSlotRef.current
      const form = restaurantFormRef.current
      if (!shell || !slot || !form) return

      const shellRect = shell.getBoundingClientRect()
      const slotRect = slot.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const maxTravel = Math.max(shellRect.height - viewportHeight, 1)
      const rawProgress = clamp(-shellRect.top / maxTravel)
      const progress = clamp((rawProgress - 0.04) / 0.7)
      const isInTransition = shellRect.bottom > 0 && shellRect.top < viewportHeight
      const introProgress = clamp((viewportHeight - shellRect.bottom + 180) / 360)

      shell.style.setProperty('--hero-transition-progress', progress.toFixed(4))
      capabilitiesSectionRef.current?.style.setProperty(
        '--capability-intro-progress',
        introProgress.toFixed(4),
      )

      if (!isInTransition) {
        form.style.opacity = '0'
        form.style.pointerEvents = 'none'
        form.style.visibility = 'hidden'
        form.style.setProperty('--search-title-opacity', '0')
        form.style.setProperty('--search-title-y', '18px')
        return
      }

      const targetWidth = Math.min(
        viewportWidth > 900 ? 980 : viewportWidth - 32,
        Math.max(280, viewportWidth - (viewportWidth > 900 ? 360 : 32)),
      )
      const scale = interpolate(1, viewportWidth > 900 ? 1.18 : 1.06, progress)
      const width = interpolate(slotRect.width, targetWidth, progress)
      const targetLeft = (viewportWidth - width) / 2
      const estimatedHeight = Math.max(slotRect.height, viewportWidth > 620 ? 64 : 118)
      const targetTop = (viewportHeight - estimatedHeight * scale) / 2
      const currentTop = interpolate(slotRect.top, targetTop, progress)
      const currentBottom = currentTop + estimatedHeight * scale
      const capabilityHeadingTop =
        capabilitiesSectionRef.current
          ?.querySelector<HTMLElement>('.section-heading')
          ?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY
      const timedExitProgress = clamp((rawProgress - 0.97) / 0.08)
      const sectionExitProgress = clamp((currentBottom + 560 - capabilityHeadingTop) / 260)
      const exitProgress = Math.max(timedExitProgress, sectionExitProgress)
      const releaseProgress = clamp((exitProgress - 0.42) / 0.58)
      const fadeProgress = clamp((exitProgress - 0.42) / 0.22)
      const fadeEase = fadeProgress * fadeProgress * (3 - 2 * fadeProgress)
      const formOpacity = 1 - fadeEase
      const isHidden = formOpacity <= 0.035 || releaseProgress >= 0.98
      const titleProgress = clamp((progress - 0.32) / 0.18)

      const currentLeft = interpolate(slotRect.left, targetLeft, progress)
      const currentY = currentTop

      form.style.left = '0px'
      form.style.opacity = isHidden ? '0' : formOpacity.toFixed(4)
      form.style.pointerEvents = formOpacity > 0.15 ? 'auto' : 'none'
      form.style.position = 'fixed'
      form.style.top = '0px'
      form.style.transform = `translate3d(${currentLeft}px, ${currentY}px, 0) scale(${scale})`
      form.style.visibility = isHidden ? 'hidden' : 'visible'
      form.style.width = `${width}px`
      form.style.zIndex = '62'
      form.style.setProperty(
        '--search-title-opacity',
        isHidden ? '0' : (titleProgress * formOpacity).toFixed(4),
      )
      form.style.setProperty('--search-title-y', `${(1 - titleProgress) * 18}px`)
    }

    const requestUpdate = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateTransition)
    }

    requestUpdate()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  useEffect(() => {
    const titleTimer = window.setInterval(() => {
      setActiveHeroTitle((current) => (current + 1) % heroTitleOptions.length)
    }, 3800)

    return () => window.clearInterval(titleTimer)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setLoopSpeed(10)
      window.clearTimeout(loopSpeedTimerRef.current)
      loopSpeedTimerRef.current = window.setTimeout(() => {
        setLoopSpeed(1)
      }, 180)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('wheel', handleScroll, { passive: true })
    window.addEventListener('touchmove', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('wheel', handleScroll)
      window.removeEventListener('touchmove', handleScroll)
      window.clearTimeout(loopSpeedTimerRef.current)
    }
  }, [])

  useEffect(() => {
    loopSpeedRef.current = loopSpeed
  }, [loopSpeed])

  useEffect(() => {
    const handlePointerActivity = () => {
      casePointerSpeedRef.current = 10
      window.clearTimeout(casePointerSpeedTimerRef.current)
      casePointerSpeedTimerRef.current = window.setTimeout(() => {
        casePointerSpeedRef.current = 1
      }, 220)
    }

    window.addEventListener('pointermove', handlePointerActivity, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerActivity)
      window.clearTimeout(casePointerSpeedTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let lastTime = performance.now()
    const baseSpeed = 34

    const animateCaseTracks = (time: number) => {
      const elapsed = Math.min((time - lastTime) / 1000, 0.05)
      lastTime = time
      const speedMultiplier = Math.max(loopSpeedRef.current, casePointerSpeedRef.current) > 1 ? 4.4 : 1
      const distance = baseSpeed * speedMultiplier * elapsed

      caseTrackRefs.current.forEach((track, rowIndex) => {
        if (!track) return

        const setWidth = track.scrollWidth / 3
        if (!Number.isFinite(setWidth) || setWidth <= 0) return

        const progress = (caseProgressRef.current[rowIndex] + distance) % setWidth
        caseProgressRef.current[rowIndex] = progress
        const x = rowIndex === 0 ? -setWidth + progress : -progress
        track.style.transform = `translate3d(${x}px, 0, 0)`
      })

      caseFrameRef.current = window.requestAnimationFrame(animateCaseTracks)
    }

    caseFrameRef.current = window.requestAnimationFrame(animateCaseTracks)

    return () => {
      if (caseFrameRef.current) window.cancelAnimationFrame(caseFrameRef.current)
    }
  }, [])

  useEffect(() => {
    const video = workflowVideoRef.current
    if (!video) return undefined

    let isVisible = false

    const restartVideo = () => {
      if (!isVisible) return
      video.currentTime = 0
      void video.play().catch(() => undefined)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const shouldPlay = entry.isIntersecting && entry.intersectionRatio >= 0.45

        if (shouldPlay && !isVisible) {
          isVisible = true
          if (video.readyState >= 1) {
            restartVideo()
          } else {
            video.addEventListener('loadedmetadata', restartVideo, { once: true })
          }
        }

        if (!entry.isIntersecting || entry.intersectionRatio < 0.12) {
          isVisible = false
          video.pause()
          video.currentTime = 0
        }
      },
      { threshold: [0, 0.12, 0.45, 0.75] },
    )

    observer.observe(video)

    return () => {
      observer.disconnect()
    }
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!restaurantName.trim()) return

    setIsGenerating(true)

    window.setTimeout(() => {
      setIsGenerating(false)
    }, 1100)
  }

  const handleCapabilityVideoEnded = () => {
    if (!isCapabilityPaused) {
      scheduleNextCapability()
    }
  }

  const resumeCapabilityRotation = () => {
    setIsCapabilityPaused(false)

    if (capabilityVideoRef.current?.ended) {
      scheduleNextCapability()
    }
  }

  const handleLanyardPullDown = () => {
    const distanceToBottom =
      document.documentElement.scrollHeight - window.scrollY - window.innerHeight

    if (distanceToBottom < window.innerHeight * 0.2) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const targets = [
      ...document.querySelectorAll<HTMLElement>(
        '.hero-section, .page-section, .bottom-visual, .footer',
      ),
    ]
    const currentY = window.scrollY + 120
    const nextTarget = targets.find((target) => target.offsetTop > currentY)

    if (nextTarget) {
      nextTarget.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const scrollToOfficialDetail = () => {
    document
      .getElementById('official-detail')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="site-shell">
      <nav className="nav">
        <a className="brand" href="#top" aria-label="Kitchain home">
          <span className="brand-mark">K</span>
          Kitchain
        </a>
        <PillNav
          linksOnly
          items={primaryNavItems}
          ease="power3.easeOut"
          baseColor="#0a0d0b"
          pillColor="#ffffff"
          hoveredPillTextColor="#ffffff"
          pillTextColor="#0a0d0b"
        />
        <div className="nav-actions">
          <a className="nav-login" href="#login">
            登录
          </a>
          <a className="nav-cta" href="#top">
            免费演示
          </a>
        </div>
      </nav>
      <div className="lanyard-stage" aria-hidden="true">
        <Lanyard
          position={[0, 0, 24]}
          gravity={[0, -40, 0]}
          frontImage={publicAsset('/lanyard-front.svg?v=4')}
          backImage={publicAsset('/lanyard-back.svg?v=2')}
          imageFit="cover"
          lanyardWidth={1.08}
          sceneOffset={[0, 0, 0]}
          onPullDown={handleLanyardPullDown}
        />
      </div>

      <div
        className="hero-transition-shell"
        ref={heroTransitionRef}
      >
        <section className="hero-section" id="top">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="dot-icon" aria-hidden="true" />
              只需从一个店名开始
            </p>
            <h1 className="hero-title">
              <span>科技</span>
              <span className="hero-title-rotator" key={activeHeroTitle}>
                {heroTitleOptions[activeHeroTitle].map((segment, index) => (
                  <span
                    className={`hero-title-segment delay-${index}`}
                    key={`${segment}-${index}`}
                  >
                    {segment}
                  </span>
                ))}
              </span>
            </h1>
            <p className="hero-text">
              <span>专为餐饮打造的AI</span>
              <span>用最少的精力做好最细致的工作</span>
            </p>
          </div>

          <div className="hero-image">
            <div className="hero-screen-video" aria-hidden="true">
              <div className="hero-screen-plane">
                <video
                  autoPlay
                  controls={false}
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  loop
                  muted
                  playsInline
                  preload="auto"
                  src={publicAsset('/homepage-main-animation.mp4')}
                />
              </div>
            </div>
            <img
              src={publicAsset('/hero-macbook-screen-cutout.png')}
              alt="Kitchain product shown on a MacBook"
            />
          </div>

          <div className="restaurant-form-slot" ref={restaurantFormSlotRef} aria-hidden="true" />

          <form
            className="restaurant-form"
            onSubmit={handleSubmit}
            ref={restaurantFormRef}
          >
            <div className="restaurant-form-title" aria-hidden="true">
              <TextType
                className="search-start-type"
                cursorBlinkDuration={0.5}
                cursorCharacter="_"
                deletingSpeed={90}
                loop
                pauseDuration={1500}
                showCursor
                text="KITCHAIN 从此开始"
                typingSpeed={90}
                variableSpeedEnabled={false}
              />
            </div>
            <div className="input-row">
              <input
                id="restaurant"
                aria-label="输入你的店名"
                value={restaurantName}
                onChange={(event) => setRestaurantName(event.target.value)}
                placeholder="输入你的店名"
              />
              <button type="submit">
                {isGenerating ? '生成中' : '点击获取报告 ->'}
              </button>
            </div>
          </form>
        </section>

        <section className="hero-search-transition" aria-hidden="true">
          <div className="hero-search-center-guide" />
        </section>
      </div>

      <section
        className="capabilities-section page-section"
        id="workflow"
        ref={capabilitiesSectionRef}
      >
        <div className="section-heading">
          <p className="section-label">Kitchain 能够做到什么</p>
          <h2>从整合数据，到提出方案，再到为你执行。</h2>
        </div>
        <div
          className="capability-tabs"
          aria-label="Kitchain capability tabs"
          onMouseLeave={resumeCapabilityRotation}
          style={{ '--active-tab-left': activeCapabilityLeft } as CSSProperties}
        >
          <span className="capability-tab-bubble" aria-hidden="true" />
          {capabilityTabs.map((tab, index) => (
            <button
              className={index === activeCapability ? 'active' : ''}
              key={tab}
              onBlur={() => setIsCapabilityPaused(false)}
              onFocus={() => {
                setIsCapabilityPaused(true)
                setActiveCapability(index)
              }}
              onMouseEnter={() => {
                setIsCapabilityPaused(true)
                setActiveCapability(index)
              }}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
        <article className="capability-feature-card">
          {capabilityCards[activeCapability].media ? (
            <video
              key={capabilityCards[activeCapability].media}
              src={capabilityCards[activeCapability].media}
              autoPlay
              controls={false}
              controlsList="nodownload nofullscreen noremoteplayback"
              disablePictureInPicture
              muted
              onCanPlay={(event) => {
                const video = event.currentTarget
                video.controls = false
                video.muted = true
                if (video.paused) void video.play().catch(() => undefined)
              }}
              onEnded={handleCapabilityVideoEnded}
              playsInline
              preload="auto"
              ref={capabilityVideoRef}
            />
          ) : (
            <div className="capability-fallback">
              <span>{String(activeCapability + 1).padStart(2, '0')}</span>
              <h3>{capabilityCards[activeCapability].title}</h3>
              <p>{capabilityCards[activeCapability].body}</p>
            </div>
          )}
        </article>
      </section>

      <section className="cases-section page-section">
        <div className="section-heading">
          <p className="section-label">优秀案例展示</p>
          <h2>不同餐饮业态，都能从一个店名开始找到增长动作。</h2>
        </div>
        <div className="case-gallery-shell">
          {caseShowcaseRows.map((row, rowIndex) => (
            <div className={`case-marquee-row row-${rowIndex + 1}`} key={`case-row-${rowIndex + 1}`}>
              <div
                className="case-marquee-track"
                ref={(node) => {
                  caseTrackRefs.current[rowIndex] = node
                }}
                style={{ '--case-count': row.length } as CSSProperties}
              >
                {[0, 1, 2].map((copyIndex) => (
                  <div className="case-marquee-set" key={`case-row-${rowIndex + 1}-${copyIndex}`}>
                    {row.map((item) => (
                      <article className="case-marquee-card" key={`${item.id}-${copyIndex}`}>
                        <img alt={item.id} src={item.img} />
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="video-section page-section">
        <div className="section-heading">
          <p className="section-label">一分钟即可上手</p>
          <h2>复盘和执行，从未如此简单，区别你能看到。</h2>
        </div>
        <div className="video-grid">
          {videoCards.map((card) => (
            <article className={`video-card ${card.orientation}${card.media ? ' has-media' : ''}`} key={card.title}>
              {card.media ? (
                <>
                  <video
                    autoPlay
                    controls={false}
                    controlsList="nodownload nofullscreen noremoteplayback"
                    disablePictureInPicture
                    loop
                    muted
                    onCanPlay={(event) => {
                      const video = event.currentTarget
                      video.controls = false
                      video.muted = true
                      if (video.paused) void video.play().catch(() => undefined)
                    }}
                    playsInline
                    preload="auto"
                    ref={card.orientation === 'wide' ? workflowVideoRef : undefined}
                    src={card.media}
                  />
                  {card.caption ? (
                    <p className="video-card-caption" style={{ color: card.captionColor }}>
                      {card.caption}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <span>{card.orientation === 'wide' ? '16:9' : '9:16'}</span>
                  <h3>{card.title}</h3>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="founder-section page-section">
        <div className="loop-orbit-section" aria-hidden="true">
          <CurvedLoop
            className="section-loop-text orbit-loop-text"
            direction="right"
            interactive={false}
            marqueeText={connectorText}
            pathVariant="wave"
            speed={loopSpeed}
          />
        </div>
        <div className="founder-heading">
          <p className="section-label">创始人理念</p>
          <blockquote>
            <span>“餐饮老板不缺努力，缺的是把复杂</span>
            <span>信息，变成下一步行动的系统。”</span>
          </blockquote>
        </div>
        <div className="founder-circles" aria-label="Founder principles">
          <article className="founder-circle-card side">
            <div className="founder-circle" />
            <p>把分散的经营信号，变成老板能看懂的问题。</p>
          </article>
          <article className="founder-circle-card center">
            <div className="founder-circle" />
            <p>不止给建议，也把下一步动作推到执行位置。</p>
          </article>
          <article className="founder-circle-card side">
            <div className="founder-circle" />
            <p>让每一次营销动作，都能留下可复用的数据判断。</p>
          </article>
        </div>
      </section>

      <section className="official-section page-section">
        <div className="section-heading">
          <p className="section-label">了解我们</p>
          <h2>
            <span>关注Kitchain的产品</span>
            <span>更新、餐饮洞察</span>
            <span>和增长案例。</span>
          </h2>
        </div>
        <div className="official-swap-stage">
          <ClickSpark
            duration={420}
            extraScale={1.05}
            sparkColor="#0a0d0b"
            sparkCount={8}
            sparkRadius={35}
            sparkSize={11}
          >
            <CardSwap
            cardDistance={108}
            delay={5500}
            height={450}
            onCardClick={scrollToOfficialDetail}
            pauseOnHover={false}
            verticalDistance={86}
            width={1200}
            >
              {officialCards.map((card, index) => (
                <Card key={card.title}>
                  <span>{String(index + 1).padStart(2, '0')} / OFFICIAL</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </Card>
              ))}
            </CardSwap>
          </ClickSpark>
        </div>
      </section>

      <section
        className="official-detail-section page-section"
        id="official-detail"
        aria-label="Official channel detail placeholder"
      />

      <section className="bottom-visual" aria-label="Kitchain bottom visual">
        <TrueFocus
          animationDuration={0.5}
          blurAmount={5}
          borderColor="#1ee66f"
          glowColor="rgba(30, 230, 111, 0.58)"
          pauseBetweenAnimations={0.8}
          sentence="KIT CHAIN"
          sweepCount={1}
        />
      </section>

      <footer className="footer">
        <a className="brand" href="#top" aria-label="Kitchain home">
          <span className="brand-mark">K</span>
          Kitchain
        </a>
        <p>让餐饮经营，从一个店名开始。</p>
        <div className="footer-actions">
          <a className="footer-button primary" href="#top">
            获得免费诊断
          </a>
          <a className="footer-button secondary" href="#workflow">
            看看Kitchain如何运作
          </a>
        </div>
      </footer>
    </main>
  )
}

export default App
