export type PhotoViewFrameSpec = {
  id: string
  category: string
  jsSrc: string
}

export type PhotoViewScreenRect = {
  left: number
  top: number
  width: number
  height: number
}

export type PhotoViewWorldRect = {
  x: number
  y: number
  width: number
  height: number
}

export type PhotoViewViewport = {
  w: number
  h: number
}

/** Narrow wall API implemented by the homepage gallery host. */
export type PhotoViewHost = {
  getFrameSpec(id: string): PhotoViewFrameSpec | null
  getFrameWorldRect(id: string): PhotoViewWorldRect | null
  getFrameScreenRect(id: string): PhotoViewScreenRect | null
  getSplashHandoffRect(id: string): PhotoViewWorldRect | null
  isFrameVisible(rect: PhotoViewScreenRect): boolean
  pickFrameAt(clientX: number, clientY: number): string | null

  getViewport(): PhotoViewViewport
  getGridUnit(): number

  enterPhotoView(): boolean
  exitPhotoView(): void
  setEffectPassthrough(passthrough: boolean): void

  setScrollLocked(locked: boolean): void
  hideWallDomImmediately(): void
  showWallDomImmediately(): void
  fadeWallDom(show: boolean): void
  ensureCanvasVisible(): void

  onPhotoViewAfterClose(): void
}
