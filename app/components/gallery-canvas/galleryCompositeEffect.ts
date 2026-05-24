import { Effect } from "postprocessing";
import { Uniform } from "three";
import type { GalleryMeshRegistry } from "~/components/gallery-canvas/galleryMeshRegistry";
import compositePostFragmentShader from "~/components/gallery-canvas/shaders/compositePost.frag.glsl?raw";

type GalleryCompositeEffectOptions = {
	registry: GalleryMeshRegistry;
};

export class GalleryCompositeEffectImpl extends Effect {
	private readonly registry: GalleryMeshRegistry;

	constructor({ registry }: GalleryCompositeEffectOptions) {
		super("GalleryCompositeEffect", compositePostFragmentShader, {
			uniforms: new Map([
				["u_type", new Uniform(registry.effectUniforms.u_type.value)],
				["scroll_pow", new Uniform(registry.effectUniforms.scroll_pow.value)],
				["modeChangePow", new Uniform(registry.effectUniforms.modeChangePow.value)],
				["mode", new Uniform(registry.effectUniforms.mode.value)],
				["device", new Uniform(registry.effectUniforms.device.value)],
			]),
		});
		this.registry = registry;
	}

	update(
		_renderer: unknown,
		_inputBuffer: unknown,
		_deltaTime: number,
	): void {
		const src = this.registry.effectUniforms;
		this.uniforms.get("u_type")!.value = src.u_type.value;
		this.uniforms.get("scroll_pow")!.value = src.scroll_pow.value;
		this.uniforms.get("modeChangePow")!.value = src.modeChangePow.value;
		this.uniforms.get("mode")!.value = src.mode.value;
		this.uniforms.get("device")!.value = src.device.value;
	}
}
