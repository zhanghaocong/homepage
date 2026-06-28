import { createReactRouterAppConfig } from '@workspace/eslint-config'

export default createReactRouterAppConfig({
  ignores: ['build/', '.react-router/', '.wrangler/', 'public/', 'worker-configuration.d.ts', '**/*.tsbuildinfo'],
  prettier: true,
})
