import type { CateKey } from '~/data/gallery'

/** Nav / route id (`interior`) from layout category key (`Interior`). */
export function normalizeCategoryId(category: string): string {
  return category.toLowerCase()
}

export function categoryIdFromKey(key: CateKey): string {
  return key.toLowerCase()
}
