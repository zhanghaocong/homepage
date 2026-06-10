import { useAtomValue } from 'jotai/react'
import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject, type WheelEvent } from 'react'
import { PhotoViewBgImage, thumbWrapClass } from '~/features/photo-view/PhotoViewImage'
import { CATEGORY_UI, galleryImages, imageUrl } from '~/data/gallery'
import { getGalleryMeshRegistry } from '~/features/wall/lib/galleryRegistryBridge'
import { pickWallLayoutIdAt } from '~/features/photo-view/lib/galleryWallPick'
import {
  closePhotoView,
  isPhotoViewClosing,
  markPhotoViewUiReady,
  openPhotoViewFromLayoutId,
} from '~/features/photo-view/lib/photoViewController'
import { getImageAspect, heroCenterRect, worldRectToScreen, type PhotoViewScreenRect } from '~/features/photo-view/lib/photoViewLayout'
import {
  CATE_ID_TO_KEY,
  getPhotoViewState,
  photoViewAtom,
  photoViewStore,
  setPhotoViewState,
} from '~/features/photo-view/lib/photoViewStore'

type PhotoViewProps = {
  wrapRef: RefObject<HTMLElement | null>
}

function screenStyle(rect: PhotoViewScreenRect): React.CSSProperties {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export function PhotoView({ wrapRef }: PhotoViewProps) {
  const state = useAtomValue(photoViewAtom, { store: photoViewStore })
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([])
  const openedRef = useRef(false)
  const lastWheelAtRef = useRef(0)

  const cateKey = CATE_ID_TO_KEY[state.category]
  const images = galleryImages[cateKey]
  const activeImage = images[state.activeIndex]
  const categoryLabel = CATEGORY_UI.find((c) => c.id === state.category)?.label ?? state.category

  const openPhotoListImmediately = useCallback(() => {
    const registry = getGalleryMeshRegistry()
    if (!registry) return false

    registry.setWallMeshesHidden(true)
    registry.effectUniforms.u_type.value = 0
    markPhotoViewUiReady()
    return true
  }, [])

  const setActivePhoto = useCallback(
    (index: number) => {
      const next = images[index]
      if (!next || index === state.activeIndex) return
      setPhotoViewState({
        activeIndex: index,
        heroSrc: imageUrl(next['2048x2048']),
      })
    },
    [images, state.activeIndex],
  )

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (!state.open || !state.uiReady) return

      const direction = Math.sign(event.deltaY)
      if (direction === 0 || Math.abs(event.deltaY) < 10) return

      event.preventDefault()
      event.stopPropagation()

      const now = performance.now()
      if (now - lastWheelAtRef.current < 140) return
      lastWheelAtRef.current = now

      const nextIndex = Math.min(Math.max(state.activeIndex + direction, 0), images.length - 1)
      setActivePhoto(nextIndex)
    },
    [images.length, setActivePhoto, state.activeIndex, state.open, state.uiReady],
  )

  useEffect(() => {
    const registry = getGalleryMeshRegistry()
    if (!registry) return
    const passthrough = state.open && !state.closing
    registry.effectUniforms.u_type.value = passthrough ? 0 : 1
  }, [state.open, state.closing])

  useLayoutEffect(() => {
    if (!state.open) {
      openedRef.current = false
      thumbRefs.current = []
      const registry = getGalleryMeshRegistry()
      registry?.restoreWallMeshes()
      registry?.onResize()
      return
    }

    if (!openedRef.current && !state.uiReady && !isPhotoViewClosing()) {
      openedRef.current = true
      if (!openPhotoListImmediately()) {
        openedRef.current = false
        getGalleryMeshRegistry()?.restoreWallMeshes()
        closePhotoView()
      }
    }
  }, [state.open, openPhotoListImmediately])

  useLayoutEffect(() => {
    if (!state.open || !state.uiReady) return
    thumbRefs.current[state.activeIndex]?.scrollIntoView({
      block: 'center',
      behavior: 'auto',
    })
  }, [state.activeIndex, state.open, state.uiReady])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      if (isPhotoViewClosing()) return
      const current = getPhotoViewState()

      if (!current.open) {
        const layoutId = pickWallLayoutIdAt(event.clientX, event.clientY)
        if (!layoutId) return
        event.preventDefault()
        event.stopPropagation()
        openPhotoViewFromLayoutId(layoutId)
      }
    }

    wrap.addEventListener('pointerdown', onPointerDown, true)
    return () => wrap.removeEventListener('pointerdown', onPointerDown, true)
  }, [wrapRef])

  if (!state.open) return null

  const heroMedium = activeImage != null ? imageUrl(activeImage.medium) : state.heroSrc
  const heroW = activeImage?.width ?? 1
  const heroH = activeImage?.height ?? 1
  const heroSrc = state.uiReady ? state.heroSrc : heroMedium
  const heroStyle = activeImage
    ? screenStyle(worldRectToScreen(heroCenterRect(getImageAspect(activeImage))))
    : undefined

  return (
    <div
      className={`p-photo-view${state.uiReady ? 'is-ui-ready' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`${categoryLabel} gallery`}
      aria-hidden={!state.open}
      onWheel={handleWheel}
    >
      <div className="p-photo-view__fly js-img__wrap js-img__bg" style={heroStyle}>
        <PhotoViewBgImage
          src={heroSrc}
          width={heroW}
          height={heroH}
          className="js-img js-bg u-br p-photo-view__fly-img is-loaded"
        />
      </div>

      <button
        type="button"
        className="p-photo-view__close fs-s"
        aria-label="Close gallery view"
        onClick={() => closePhotoView()}
      >
        Close
      </button>

      <div className="p-cate__fixed p-photo-view__fixed">
        <div className="p-photo-view__border p-cate__border to" aria-hidden />
        <div className="p-cate__category p-photo-view__category">
          <p className="fs-s u-upper u-sub to">
            <span>Category</span>
          </p>
          <h2 className="fs-xl to">{categoryLabel}</h2>
        </div>
      </div>

      <div className="p-photo-view__rail">
        <div className="p-photo-view__scroll">
          <div className="p-cate__lists p-photo-view__lists">
            {images.map((image, index) => {
              const thumbSrc = imageUrl(image.medium)
              return (
                <button
                  key={`${state.category}-${index}-${thumbSrc}`}
                  ref={(node) => {
                    thumbRefs.current[index] = node
                  }}
                  type="button"
                  className={`${thumbWrapClass(image.width, image.height)} ${
                    index === state.activeIndex ? 'active' : ''
                  }`}
                  style={{ aspectRatio: `${image.width} / ${image.height}` }}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === state.activeIndex}
                  onClick={() => setActivePhoto(index)}
                >
                  <PhotoViewBgImage
                    src={thumbSrc}
                    width={image.width}
                    height={image.height}
                    className="js-img js-bg u-br p-cate__tmb-img is-loaded"
                  />
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="p-photo-view__backdrop"
        aria-label="Close gallery view"
        onClick={() => closePhotoView()}
      />
    </div>
  )
}
