import { AdminPage } from '~/features/admin/AdminPage'

export function meta() {
  return [{ title: 'Admin' }, { name: 'robots', content: 'noindex, nofollow' }]
}

export function loader() {
  if (!import.meta.env.DEV) {
    throw new Response('Not Found', { status: 404 })
  }

  return null
}

export default function AdminRoute() {
  return <AdminPage />
}
