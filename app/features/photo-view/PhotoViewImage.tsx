import { forwardRef, useCallback, useLayoutEffect, useRef } from 'react'

/** photoyoshi lazy-image DOM: `.js-img` div with `src` + `background-image`. */
export const PhotoViewBgImage = forwardRef<
  HTMLDivElement,
  {
    src: string
    width: number
    height: number
    className?: string
  }
>(function PhotoViewBgImage({ src, width, height, className = 'js-img js-bg u-br is-loaded' }, forwardedRef) {
  const nodeRef = useRef<HTMLDivElement | null>(null)

  const setRef = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node
      if (typeof forwardedRef === 'function') forwardedRef(node)
      else if (forwardedRef) forwardedRef.current = node
    },
    [forwardedRef],
  )

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!node) return
    node.setAttribute('src', src)
    node.style.aspectRatio = `${width} / ${height}`
    node.style.backgroundImage = `url("${src}")`
  }, [src, width, height])

  return <div ref={setRef} className={className} role="img" aria-hidden />
})

export function thumbWrapClass(width: number, height: number) {
  const orient = width > height ? 'p-cate__tmb-hr' : 'p-cate__tmb-vr'
  return `js-img__wrap js-img__bg p-cate__tmb-wrap ${orient}`
}
