import { createReactRouterAppConfig } from '@workspace/eslint-config'

export default createReactRouterAppConfig({
  tsconfigRootDir: import.meta.dirname,
  ignores: ['dist', 'build', '.react-router'],
})
