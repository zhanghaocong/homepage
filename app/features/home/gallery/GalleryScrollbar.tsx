import type { RefObject } from 'react'

type GalleryScrollbarProps = {
  thumbBeforeRef: RefObject<HTMLDivElement | null>
  thumbAfterRef: RefObject<HTMLDivElement | null>
}

export function GalleryScrollbar({ thumbBeforeRef, thumbAfterRef }: GalleryScrollbarProps) {
  return (
    <div className="c-scrollbar" data-dir="hr">
      <div className="c-thumb">
        <div className="c-pivot" ref={thumbBeforeRef} />
        <div className="c-pivot" ref={thumbAfterRef} />
      </div>
    </div>
  )
}
