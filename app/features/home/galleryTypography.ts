/** Gallery splash / wall typography — Tailwind replacements for photoyoshi fs-* scale. */
export const galleryText = {
  xxl: 'text-[17vw] font-bold tracking-[-0.06em] ml-[-0.8vw] text-[var(--site-fg,#252726)] max-[680px]:text-[68px]',
  xl: 'text-[clamp(45px,4.6875vw,90px)] tracking-[-0.04em] leading-none text-[var(--site-fg,#252726)] max-[680px]:text-[60px]',
  l: 'text-[clamp(24px,2.5vw,48px)] text-[var(--site-fg,#252726)] max-[680px]:text-[60px]',
  s: 'text-[clamp(14px,0.9375vw,18px)] max-[680px]:text-[15px] text-[var(--site-fg,#252726)]',
} as const
