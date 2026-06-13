import { Effect } from 'postprocessing'
import { Uniform } from 'three'
import type { GalleryEffectUniforms } from '~/features/home/canvas/galleryMeshRegistry'
import compositePostFragmentShader from '~/features/home/canvas/shaders/compositePost.frag.glsl?raw'

type GalleryCompositeEffectOptions = {
  effectUniforms: GalleryEffectUniforms
}

export class GalleryCompositeEffectImpl extends Effect {
  private readonly effectUniforms: GalleryEffectUniforms

  constructor({ effectUniforms }: GalleryCompositeEffectOptions) {
    super('GalleryCompositeEffect', compositePostFragmentShader, {
      uniforms: new Map([
        ['u_type', new Uniform(effectUniforms.u_type.value)],
        ['scroll_pow', new Uniform(effectUniforms.scroll_pow.value)],
        ['modeChangePow', new Uniform(effectUniforms.modeChangePow.value)],
        ['mode', new Uniform(effectUniforms.mode.value)],
        ['device', new Uniform(effectUniforms.device.value)],
      ]),
    })
    this.effectUniforms = effectUniforms
  }

  update(_renderer: unknown, _inputBuffer: unknown, _deltaTime: number): void {
    const src = this.effectUniforms
    this.uniforms.get('u_type')!.value = src.u_type.value
    this.uniforms.get('scroll_pow')!.value = src.scroll_pow.value
    this.uniforms.get('modeChangePow')!.value = src.modeChangePow.value
    this.uniforms.get('mode')!.value = src.mode.value
    this.uniforms.get('device')!.value = src.device.value
  }
}
