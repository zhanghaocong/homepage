import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/_index.tsx'),
  route('about', 'routes/about.tsx'),
  route('albums/:albumId', 'routes/album.tsx'),
  route('tags/:tag', 'routes/tag.tsx'),
  route('*', 'routes/$.tsx'),
] satisfies RouteConfig
