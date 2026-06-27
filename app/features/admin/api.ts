import type { AdminState, SeriesManifest, SyncResult } from './types'

const API_BASE = '/api/admin'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, init)
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>

  if (!response.ok) {
    const message = typeof body.error === 'string' ? body.error : `Request failed (${response.status})`
    throw new Error(message)
  }

  return body as T
}

export async function fetchAdminState(): Promise<AdminState> {
  return request<AdminState>('')
}

export async function createSeries(input: { id: string; title: string }) {
  return request<{ manifest: SeriesManifest }>('/series', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function updateSeries(seriesId: string, input: { title: string }) {
  return request<{ manifest: SeriesManifest }>(`/series/${seriesId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
}

export async function deleteSeries(seriesId: string) {
  return request<{ manifest: SeriesManifest }>(`/series/${seriesId}`, { method: 'DELETE' })
}

export async function uploadPhotos(seriesId: string, files: File[]) {
  const formData = new FormData()
  for (const file of files) {
    formData.append('photos', file)
  }

  return request<{ manifest: SeriesManifest; uploaded: number }>(`/series/${seriesId}/photos`, {
    method: 'POST',
    body: formData,
  })
}

export async function deletePhoto(seriesId: string, photoId: string) {
  return request<{ manifest: SeriesManifest }>(`/series/${seriesId}/photos/${photoId}`, { method: 'DELETE' })
}

export async function reorderPhotos(seriesId: string, photoIds: string[]) {
  return request<{ manifest: SeriesManifest }>(`/series/${seriesId}/photos/order`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ photoIds }),
  })
}

export async function regenerateManifest() {
  return request<{ manifest: SeriesManifest }>('/regenerate', { method: 'POST' })
}

export async function syncToR2(updateManifest: boolean) {
  return request<{ manifest: SeriesManifest; sync: SyncResult }>('/sync-r2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ updateManifest }),
  })
}
