import { createReactRouterAppConfig } from '@workspace/eslint-config'

export default createReactRouterAppConfig({
  ignores: ['dist', 'build', '.react-router'],
})
