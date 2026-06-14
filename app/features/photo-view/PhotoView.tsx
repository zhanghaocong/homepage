import { useCallback, useEffect, useLayoutEffect, useRef, type WheelEvent } from 'react'
import { galleryText } from '~/features/home/galleryTypography'
import { PhotoViewBgImage, thumbWrapClass } from '~/features/photo-view/PhotoViewImage'
import { CATEGORY_UI, galleryImages, imageUrl } from '~/data/gallery'
import { usePhotoViewHost, usePhotoViewState } from '~/features/photo-view/ctx'
import { closePhotoView, isPhotoViewClosing, markPhotoViewUiReady } from '~/features/photo-view/lib/photoViewController'
import { getImageAspect, heroCenterRect, worldRectToScreen, type PhotoViewScreenRect } from '~/features/photo-view/lib/photoViewLayout'
import { CATE_ID_TO_KEY, setPhotoViewState } from '~/features/photo-view/lib/photoViewStore'

function screenStyle(rect: PhotoViewScreenRect): React.CSSProperties {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
  }
}

export function PhotoView() {
  const host = usePhotoViewHost()
  const state = usePhotoViewState()
  const thumbRefs = useRef<Array<HTMLButtonElement | null>>([])
  const openedRef = useRef(false)
  const lastWheelAtRef = useRef(0)

  const cateKey = CATE_ID_TO_KEY[state.category]
  const images = galleryImages[cateKey]
  const activeImage = images[state.activeIndex]
  const categoryLabel = CATEGORY_UI.find((c) => c.id === state.category)?.label ?? state.category

  const openPhotoListImmediately = useCallback(() => {
    if (!host.enterPhotoView()) return false
    markPhotoViewUiReady()
    return true
  }, [host])

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
    const passthrough = state.open && !state.closing
    host.setEffectPassthrough(passthrough)
  }, [host, state.open, state.closing])

  useLayoutEffect(() => {
    if (!state.open) {
      openedRef.current = false
      thumbRefs.current = []
      host.exitPhotoView()
      return
    }

    if (!openedRef.current && !state.uiReady && !isPhotoViewClosing()) {
      openedRef.current = true
      if (!openPhotoListImmediately()) {
        openedRef.current = false
        host.exitPhotoView()
        closePhotoView()
      }
    }
  }, [host, state.open, openPhotoListImmediately, state.uiReady])

  useLayoutEffect(() => {
    if (!state.open || !state.uiReady) return
    thumbRefs.current[state.activeIndex]?.scrollIntoView({
      block: 'center',
      behavior: 'auto',
    })
  }, [state.activeIndex, state.open, state.uiReady])

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
      className={`p-photo-view${state.uiReady ? ' is-ui-ready' : ''}`}
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
          className="js-img js-bg p-photo-view__fly-img is-loaded"
        />
      </div>

      <button
        type="button"
        className={`p-photo-view__close ${galleryText.s}`}
        aria-label="Close gallery view"
        onClick={() => closePhotoView()}
      >
        Close
      </button>

      <div className="p-cate__fixed p-photo-view__fixed">
        <div className="p-photo-view__border p-cate__border to" aria-hidden />
        <div className="p-cate__category p-photo-view__category">
          <p className={`${galleryText.s} uppercase opacity-50 to`}>
            <span>Category</span>
          </p>
          <h2 className={`${galleryText.xl} to`}>{categoryLabel}</h2>
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
                    className="js-img js-bg p-cate__tmb-img is-loaded"
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
