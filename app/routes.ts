import { type RouteConfig, index, route } from '@react-router/dev/routes'

const devOnlyRoutes: RouteConfig = import.meta.env.DEV ? [route('admin', 'routes/admin.tsx')] : []

export default [
  index('routes/_index.tsx'),
  route('series', 'routes/series.tsx'),
  route('about', 'routes/about.tsx'),
  ...devOnlyRoutes,
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig
