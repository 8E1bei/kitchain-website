import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from 'ogl'
import { useEffect, useRef } from 'react'
import './CircularGallery.css'

type GL = Renderer['gl']

type GalleryItem = {
  image: string
  imageOffsetY?: number
  text?: string
  title?: string
  line1?: string
  line2?: string
}

type ScreenSize = {
  width: number
  height: number
}

type ViewportSize = {
  width: number
  height: number
}

type Point = {
  x: number
  y: number
}

type CircularGalleryProps = {
  items?: GalleryItem[]
  bend?: number
  textColor?: string
  borderRadius?: number
  font?: string
  scrollSpeed?: number
  scrollEase?: number
  autoScrollSpeed?: number
  interactive?: boolean
  itemScale?: number
}

function debounce<T extends (...args: never[]) => void>(func: T, wait: number) {
  let timeout: number

  return (...args: Parameters<T>) => {
    window.clearTimeout(timeout)
    timeout = window.setTimeout(() => func(...args), wait)
  }
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function autoBind(instance: object) {
  const proto = Object.getPrototypeOf(instance)
  Object.getOwnPropertyNames(proto).forEach((key) => {
    const value = (instance as Record<string, unknown>)[key]
    if (key !== 'constructor' && typeof value === 'function') {
      ;(instance as Record<string, unknown>)[key] = value.bind(instance)
    }
  })
}

class GalleryMedia {
  geometry: Plane
  gl: GL
  image: string
  imageOffsetY: number
  index: number
  length: number
  scene: Transform
  screen: ScreenSize
  viewport: ViewportSize
  bend: number
  borderRadius: number
  itemScale: number
  labelElement: HTMLDivElement
  extra = 0
  speed = 0
  isBefore = false
  isAfter = false
  program!: Program
  plane!: Mesh
  scale!: number
  padding!: number
  width!: number
  widthTotal!: number
  x!: number

  constructor({
    geometry,
    gl,
    image,
    imageOffsetY = 0,
    index,
    length,
    scene,
    screen,
    viewport,
    bend,
    borderRadius = 0,
    itemScale,
    labelElement,
  }: {
    geometry: Plane
    gl: GL
    image: string
    imageOffsetY?: number
    index: number
    length: number
    scene: Transform
    screen: ScreenSize
    viewport: ViewportSize
    bend: number
    borderRadius?: number
    itemScale: number
    labelElement: HTMLDivElement
  }) {
    this.geometry = geometry
    this.gl = gl
    this.image = image
    this.imageOffsetY = imageOffsetY
    this.index = index
    this.length = length
    this.scene = scene
    this.screen = screen
    this.viewport = viewport
    this.bend = bend
    this.borderRadius = borderRadius
    this.itemScale = itemScale
    this.labelElement = labelElement
    this.createShader()
    this.createMesh()
    this.onResize()
  }

  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: true })
    const fallbackCanvas = document.createElement('canvas')
    const fallbackContext = fallbackCanvas.getContext('2d')
    fallbackCanvas.width = 2
    fallbackCanvas.height = 2
    if (fallbackContext) {
      fallbackContext.fillStyle = '#0a0d0b'
      fallbackContext.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height)
    }
    texture.image = fallbackCanvas

    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform float uTime;
        uniform float uSpeed;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          vec3 p = position;
          p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uImageOffsetY;
        varying vec2 vUv;

        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }

        void main() {
          vec2 ratio = vec2(
            min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0),
            min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)
          );
          vec2 uv = vec2(
            vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
            vUv.y * ratio.y + (1.0 - ratio.y) * 0.5 + uImageOffsetY
          );
          uv.y = clamp(uv.y, 0.0, 1.0);
          vec4 color = texture2D(tMap, uv);
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          float edgeSmooth = 0.002;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [0, 0] },
        uImageSizes: { value: [1, 1] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
        uImageOffsetY: { value: this.imageOffsetY },
      },
      transparent: true,
    })

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = this.image
    img.onload = () => {
      texture.image = img
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight]
    }
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    })
    this.plane.setParent(this.scene)
  }

  update(scroll: { current: number; last: number }, direction: 'right' | 'left') {
    this.plane.position.x = this.x - scroll.current - this.extra

    const x = this.plane.position.x
    const halfWidth = this.viewport.width / 2

    if (this.bend === 0) {
      this.plane.position.y = 0
      this.plane.rotation.z = 0
    } else {
      const absoluteBend = Math.abs(this.bend)
      const radius = (halfWidth * halfWidth + absoluteBend * absoluteBend) / (2 * absoluteBend)
      const effectiveX = Math.min(Math.abs(x), halfWidth)
      const arc = radius - Math.sqrt(radius * radius - effectiveX * effectiveX)

      if (this.bend > 0) {
        this.plane.position.y = -arc
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / radius)
      } else {
        this.plane.position.y = arc
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / radius)
      }
    }

    this.speed = scroll.current - scroll.last
    this.program.uniforms.uTime.value += 0.04
    this.program.uniforms.uSpeed.value = this.speed

    const planeOffset = this.plane.scale.x / 2
    const viewportOffset = this.viewport.width / 2
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset

    if (direction === 'right' && this.isBefore) {
      this.extra -= this.widthTotal
      this.isBefore = this.isAfter = false
    }

    if (direction === 'left' && this.isAfter) {
      this.extra += this.widthTotal
      this.isBefore = this.isAfter = false
    }

    this.syncLabel()
  }

  onResize({ screen, viewport }: { screen?: ScreenSize; viewport?: ViewportSize } = {}) {
    if (screen) this.screen = screen
    if (viewport) this.viewport = viewport

    this.scale = this.screen.height / 1500
    this.plane.scale.y =
      ((this.viewport.height * (900 * this.scale)) / this.screen.height) * this.itemScale
    this.plane.scale.x =
      ((this.viewport.width * (700 * this.scale)) / this.screen.width) * this.itemScale
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y]
    this.padding = 2
    this.width = this.plane.scale.x + this.padding
    this.widthTotal = this.width * this.length
    this.x = this.width * this.index
    this.syncLabel()
  }

  syncLabel() {
    if (!this.labelElement || !this.screen || !this.viewport || !this.plane) return

    const { centerX, centerY, planeWidth, planeHeight } = this.getScreenMetrics()
    const top = centerY + planeHeight * 0.5 + 18

    this.labelElement.style.width = `${Math.max(220, planeWidth)}px`
    this.labelElement.style.transform = `translate3d(${centerX}px, ${top}px, 0) translateX(-50%) rotate(${this.plane.rotation.z}rad)`
  }

  getScreenMetrics() {
    const centerX = (this.plane.position.x / this.viewport.width + 0.5) * this.screen.width
    const centerY = (0.5 - this.plane.position.y / this.viewport.height) * this.screen.height
    const planeWidth = (this.plane.scale.x / this.viewport.width) * this.screen.width
    const planeHeight = (this.plane.scale.y / this.viewport.height) * this.screen.height

    return { centerX, centerY, planeWidth, planeHeight }
  }

  containsPoint(point: Point) {
    if (!this.screen || !this.viewport || !this.plane) return false

    const { centerX, centerY, planeWidth, planeHeight } = this.getScreenMetrics()
    return (
      point.x >= centerX - planeWidth * 0.5 &&
      point.x <= centerX + planeWidth * 0.5 &&
      point.y >= centerY - planeHeight * 0.5 &&
      point.y <= centerY + planeHeight * 0.5
    )
  }
}

class CircularGalleryScene {
  container: HTMLElement
  scrollSpeed: number
  autoScrollSpeed: number
  interactive: boolean
  scroll: {
    ease: number
    current: number
    target: number
    last: number
    position?: number
  }
  onCheckDebounce: () => void
  renderer!: Renderer
  gl!: GL
  camera!: Camera
  scene!: Transform
  labelLayer!: HTMLDivElement
  planeGeometry!: Plane
  medias: GalleryMedia[] = []
  screen!: ScreenSize
  viewport!: ViewportSize
  raf = 0
  boundOnResize!: () => void
  boundOnWheel!: (event: Event) => void
  boundOnTouchDown!: (event: MouseEvent | TouchEvent) => void
  boundOnTouchMove!: (event: MouseEvent | TouchEvent) => void
  boundOnTouchUp!: () => void
  boundOnPointerMove!: (event: PointerEvent) => void
  boundOnPointerLeave!: () => void
  hoverPoint: Point | null = null
  isDown = false
  start = 0

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 1,
      borderRadius = 0,
      scrollSpeed = 2,
      scrollEase = 0.05,
      autoScrollSpeed = 0.012,
      interactive = false,
      itemScale = 1,
    }: CircularGalleryProps,
  ) {
    autoBind(this)
    this.container = container
    this.scrollSpeed = scrollSpeed
    this.autoScrollSpeed = autoScrollSpeed
    this.interactive = interactive
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 }
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200)
    this.createRenderer()
    this.createLabelLayer()
    this.createCamera()
    this.createScene()
    this.onResize()
    this.createGeometry()
    this.createMedias(items, bend, borderRadius, itemScale)
    this.setInitialScrollPosition()
    this.update()
    this.addEventListeners()
  }

  createRenderer() {
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
    })
    this.gl = this.renderer.gl
    this.gl.clearColor(0, 0, 0, 0)
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement)
  }

  createLabelLayer() {
    this.labelLayer = document.createElement('div')
    this.labelLayer.className = 'circular-gallery-label-layer'
    this.container.appendChild(this.labelLayer)
  }

  createCamera() {
    this.camera = new Camera(this.gl)
    this.camera.fov = 45
    this.camera.position.z = 20
  }

  createScene() {
    this.scene = new Transform()
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 50,
      widthSegments: 100,
    })
  }

  createMedias(
    items: GalleryItem[] | undefined,
    bend: number,
    borderRadius: number,
    itemScale: number,
  ) {
    const fallbackItems: GalleryItem[] = [
      { image: '/case-black.svg', title: '社区咖啡馆', line1: '社区轻食', line2: '提升复购效率' },
      { image: '/case-black.svg', title: '川菜连锁', line1: '多店经营', line2: '串联增长动作' },
      { image: '/case-black.svg', title: '日料小店', line1: '精致正餐', line2: '做好本地搜索' },
      { image: '/case-black.svg', title: '商场轻食', line1: '工作简餐', line2: '抢占午市高峰' },
      { image: '/case-black.svg', title: '夜宵烧烤', line1: '烟火夜宵', line2: '拉动夜间客流' },
    ]
    const galleryItems = items?.length ? items : fallbackItems
    const medias = galleryItems.concat(galleryItems)

    this.medias = medias.map((data, index) => (
      new GalleryMedia({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        imageOffsetY: data.imageOffsetY ?? 0,
        index,
        length: medias.length,
        labelElement: this.createLabel(data),
        scene: this.scene,
        screen: this.screen,
        viewport: this.viewport,
        bend,
        borderRadius,
        itemScale,
      })
    ))
  }

  createLabel(data: GalleryItem) {
    const element = document.createElement('div')
    element.className = 'circular-gallery-label'

    const title = document.createElement('span')
    title.className = 'circular-gallery-label-title'
    title.textContent = data.title ?? data.text ?? ''

    const line1 = document.createElement('span')
    line1.className = 'circular-gallery-label-meta'
    line1.textContent = data.line1 ?? ''

    const line2 = document.createElement('span')
    line2.className = 'circular-gallery-label-meta'
    line2.textContent = data.line2 ?? ''

    element.append(title, line1, line2)
    this.labelLayer.appendChild(element)

    return element
  }

  setInitialScrollPosition() {
    const firstMedia = this.medias[0]
    if (!firstMedia) return

    const offset = firstMedia.width * 2
    this.scroll.current = offset
    this.scroll.target = offset
    this.scroll.last = offset
  }

  onTouchDown(event: MouseEvent | TouchEvent) {
    this.isDown = true
    this.scroll.position = this.scroll.current
    this.start = 'touches' in event ? event.touches[0].clientX : event.clientX
  }

  onTouchMove(event: MouseEvent | TouchEvent) {
    if (!this.isDown) return

    const x = 'touches' in event ? event.touches[0].clientX : event.clientX
    const distance = (this.start - x) * (this.scrollSpeed * 0.025)
    this.scroll.target = (this.scroll.position ?? 0) + distance
  }

  onTouchUp() {
    this.isDown = false
    this.onCheck()
  }

  onPointerMove(event: PointerEvent) {
    const rect = this.container.getBoundingClientRect()
    this.hoverPoint = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }
    this.updateHoveredMedia()
  }

  onPointerLeave() {
    this.hoverPoint = null
    this.setHoveredMedia(null)
  }

  onWheel(event: Event) {
    const wheelEvent = event as WheelEvent
    const delta = wheelEvent.deltaY || (wheelEvent as unknown as { wheelDelta?: number }).wheelDelta || 0
    this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2
    this.onCheckDebounce()
  }

  onCheck() {
    if (!this.medias[0]) return

    const width = this.medias[0].width
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width)
    const item = width * itemIndex
    this.scroll.target = this.scroll.target < 0 ? -item : item
  }

  onResize() {
    this.screen = {
      width: this.container.clientWidth,
      height: this.container.clientHeight,
    }
    this.renderer?.setSize(this.screen.width, this.screen.height)

    if (!this.camera) return

    this.camera.perspective({
      aspect: this.screen.width / this.screen.height,
    })
    const fov = (this.camera.fov * Math.PI) / 180
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z
    const width = height * this.camera.aspect
    this.viewport = { width, height }
    this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport }))
  }

  update() {
    if (!this.isDown) {
      this.scroll.target += this.autoScrollSpeed
    }

    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease)
    const direction = this.scroll.current > this.scroll.last ? 'right' : 'left'
    this.medias.forEach((media) => media.update(this.scroll, direction))
    if (this.hoverPoint) this.updateHoveredMedia()
    this.renderer.render({ scene: this.scene, camera: this.camera })
    this.scroll.last = this.scroll.current
    this.raf = window.requestAnimationFrame(this.update.bind(this))
  }

  updateHoveredMedia() {
    if (!this.hoverPoint) {
      this.setHoveredMedia(null)
      return
    }

    const hovered = this.medias
      .filter((media) => media.containsPoint(this.hoverPoint as Point))
      .sort((a, b) => {
        const aMetrics = a.getScreenMetrics()
        const bMetrics = b.getScreenMetrics()
        return Math.abs(aMetrics.centerX - (this.hoverPoint as Point).x) -
          Math.abs(bMetrics.centerX - (this.hoverPoint as Point).x)
      })[0] ?? null

    this.setHoveredMedia(hovered)
  }

  setHoveredMedia(activeMedia: GalleryMedia | null) {
    this.medias.forEach((media) => {
      media.labelElement.classList.toggle('is-hovered', media === activeMedia)
    })
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this)
    this.boundOnWheel = this.onWheel.bind(this)
    this.boundOnTouchDown = this.onTouchDown.bind(this)
    this.boundOnTouchMove = this.onTouchMove.bind(this)
    this.boundOnTouchUp = this.onTouchUp.bind(this)
    this.boundOnPointerMove = this.onPointerMove.bind(this)
    this.boundOnPointerLeave = this.onPointerLeave.bind(this)

    window.addEventListener('resize', this.boundOnResize)
    this.container.addEventListener('pointermove', this.boundOnPointerMove)
    this.container.addEventListener('pointerleave', this.boundOnPointerLeave)
    if (!this.interactive) return

    this.container.addEventListener('wheel', this.boundOnWheel, { passive: true })
    this.container.addEventListener('mousedown', this.boundOnTouchDown)
    window.addEventListener('mousemove', this.boundOnTouchMove)
    window.addEventListener('mouseup', this.boundOnTouchUp)
    this.container.addEventListener('touchstart', this.boundOnTouchDown, { passive: true })
    window.addEventListener('touchmove', this.boundOnTouchMove, { passive: true })
    window.addEventListener('touchend', this.boundOnTouchUp)
  }

  destroy() {
    window.cancelAnimationFrame(this.raf)
    window.removeEventListener('resize', this.boundOnResize)
    this.container.removeEventListener('pointermove', this.boundOnPointerMove)
    this.container.removeEventListener('pointerleave', this.boundOnPointerLeave)
    if (!this.interactive) {
      const canvas = this.renderer?.gl?.canvas as HTMLCanvasElement | undefined
      canvas?.parentNode?.removeChild(canvas)
      this.labelLayer?.remove()
      return
    }

    this.container.removeEventListener('wheel', this.boundOnWheel)
    this.container.removeEventListener('mousedown', this.boundOnTouchDown)
    window.removeEventListener('mousemove', this.boundOnTouchMove)
    window.removeEventListener('mouseup', this.boundOnTouchUp)
    this.container.removeEventListener('touchstart', this.boundOnTouchDown)
    window.removeEventListener('touchmove', this.boundOnTouchMove)
    window.removeEventListener('touchend', this.boundOnTouchUp)

    const canvas = this.renderer?.gl?.canvas as HTMLCanvasElement | undefined
    canvas?.parentNode?.removeChild(canvas)
    this.labelLayer?.remove()
  }
}

function CircularGallery({
  items,
  bend = 3,
  borderRadius = 0.05,
  scrollSpeed = 2,
  scrollEase = 0.05,
  autoScrollSpeed = 0.012,
  interactive = false,
  itemScale = 1,
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    const gallery = new CircularGalleryScene(containerRef.current, {
      items,
      bend,
      borderRadius,
      scrollSpeed,
      scrollEase,
      autoScrollSpeed,
      interactive,
      itemScale,
    })

    return () => gallery.destroy()
  }, [
    items,
    bend,
    borderRadius,
    scrollSpeed,
    scrollEase,
    autoScrollSpeed,
    interactive,
    itemScale,
  ])

  return <div className="circular-gallery" ref={containerRef} />
}

export default CircularGallery
