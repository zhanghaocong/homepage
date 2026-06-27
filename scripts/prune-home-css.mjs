/**
 * Keeps home.css rules whose selectors reference classes still used in the app.
 * Run: node scripts/prune-home-css.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'app/features/home/home.css'), 'utf8')

/** Substrings that must appear in a selector for the rule block to be kept. */
const KEEP = [
  'xhr-wrap',
  'is-load',
  'is-gather',
  'is-photo-view',
  'l-photo-view',
  'l-cate',
  'is-photo-view-locked',
  'js-wrapper',
  'p-home',
  'js-page',
  'js-body',
  'c-content',
  'js-gl__wrap',
  'l-splash',
  'p-home__scope',
  'c-scope',
  'p-home__fixed',
  'p-home__category',
  'c-scrollbar',
  'c-thumb',
  'c-pivot',
  'js-canvas__wrap',
  'js-img',
  'js-bg',
  'is-loaded',
  'p-cate',
  'p-photo-view',
  'fs-xxl',
  'fs-xl',
  'fs-l',
  'fs-s',
  'l-header',
  'site-shell',
  'is-dragging',
  '.o',
  '.t',
  '.to',
  '.in',
  '.out',
  '.active',
  '.--n',
  '.--grid',
  '.l1',
  '.l2',
  '.l3',
  '.l4',
  'u-upper',
  'u-sub',
  'u-br',
  ':root',
  'html',
  'body',
  '::selection',
  '::-moz-selection',
]

const DROP = [
  '.p-about',
  '.p-404',
  '.p-work',
  '.gl-wrap',
  '.gl-inner',
  '.gl-img',
  '.gl-i',
  '.c-btn',
  '.js-split',
  '.js-old',
  '.js-new',
  '.js-contents',
  '.guide-',
  '.spr',
  '.show-m',
  '.show-t',
  '.hide-m',
  '.p-home__mode',
  '.c-link__text',
  '.c-zoom',
  '.l-canvas__bg',
  '.l-dark',
  '.l-light',
  '.l-splash__bg',
  '.tablet',
  '.c-section',
  '.c-inner',
  '.c-content__wrap',
  '.p-cate__scope',
  '.xhr-wrap[data-xhr-namespace=about]',
  '.xhr-wrap[data-xhr-namespace=work]',
  '#__bs_notify__',
  '.fs-m',
  '.js-img.--34',
  '.u-ac',
]

function shouldKeep(selector) {
  if (DROP.some((d) => selector.includes(d))) return false
  return KEEP.some((k) => selector.includes(k))
}

function splitRules(css) {
  const rules = []
  let i = 0
  while (i < css.length) {
    if (css[i] === '@') {
      const start = i
      i++
      while (i < css.length && css[i] !== '{') i++
      if (i >= css.length) break
      i++
      let depth = 1
      while (i < css.length && depth > 0) {
        if (css[i] === '{') depth++
        else if (css[i] === '}') depth--
        i++
      }
      const block = css.slice(start, i)
      if (block.startsWith('@media') || block.startsWith('@supports')) {
        rules.push({ type: 'at', content: block })
      } else {
        rules.push({ type: 'raw', content: block })
      }
      continue
    }

    const start = i
    while (i < css.length && css[i] !== '{') i++
    if (i >= css.length) break
    const selector = css.slice(start, i).trim()
    i++
    let depth = 1
    while (i < css.length && depth > 0) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
      i++
    }
    const body = css.slice(start, i)
    rules.push({ type: 'rule', selector, content: body })
  }
  return rules
}

function pruneAtBlock(block) {
  const innerStart = block.indexOf('{') + 1
  const innerEnd = block.lastIndexOf('}')
  const header = block.slice(0, innerStart)
  const inner = block.slice(innerStart, innerEnd)
  const innerRules = splitRules(inner)
  const kept = innerRules.filter((r) => {
    if (r.type === 'rule') return shouldKeep(r.selector)
    if (r.type === 'at') return pruneAtBlock(r.content).length > 0
    return false
  })
  if (kept.length === 0) return ''
  const body = kept.map((r) => r.content).join('\n\n')
  return `${header}\n${body}\n}`
}

const rules = splitRules(src)
const kept = rules.filter((r) => {
  if (r.type === 'rule') return shouldKeep(r.selector)
  if (r.type === 'at') {
    const pruned = pruneAtBlock(r.content)
    return pruned.length > 0
  }
  return false
})

const header = `/* Homepage + gallery wall — pruned photoyoshi rules (used classes only). */\n\n`
let out = header + kept.map((r) => (r.type === 'at' ? pruneAtBlock(r.content) : r.content)).join('\n\n')

out = out.replace(/,\s*\.is-transition[^,{]*/g, '')
out = out.replace(/\.is-transition[^,{]*,\s*/g, '')

writeFileSync(join(root, 'app/features/home/home.css'), out)
console.log(`Pruned home.css: ${src.length} → ${out.length} bytes (${kept.length} top-level rules)`)
