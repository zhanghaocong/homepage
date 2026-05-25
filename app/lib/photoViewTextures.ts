import {
	ClampToEdgeWrapping,
	LinearFilter,
	LinearMipmapLinearFilter,
	SRGBColorSpace,
	Texture,
	TextureLoader,
	type WebGLRenderer,
} from "three";
import { imageUrl } from "~/data/gallery";

const cache = new Map<string, Texture>();
const loader = new TextureLoader();
loader.setCrossOrigin("anonymous");

function configurePhotoViewTexture(tex: Texture) {
	tex.colorSpace = SRGBColorSpace;
	tex.wrapS = ClampToEdgeWrapping;
	tex.wrapT = ClampToEdgeWrapping;
	tex.minFilter = LinearMipmapLinearFilter;
	tex.magFilter = LinearFilter;
	tex.generateMipmaps = true;
	tex.anisotropy = 1;
	tex.needsUpdate = true;
	return tex;
}

export function tunePhotoViewTextureForRenderer(
	tex: Texture,
	gl: WebGLRenderer,
) {
	const max = gl.capabilities.getMaxAnisotropy();
	tex.anisotropy = Math.min(8, max);
	tex.needsUpdate = true;
}

export function aspectFromTexture(tex: Texture): number | null {
	const img = tex.image as { width?: number; height?: number } | undefined;
	if (img?.width && img?.height) return img.width / img.height;
	return null;
}

/** Load full-resolution photo for detail view (2048 webp, not atlas sprites). */
export function loadPhotoViewTexture(path: string): Promise<Texture> {
	const url = path.endsWith(".webp") ? path : imageUrl(path);
	const cached = cache.get(url);
	if (cached) return Promise.resolve(cached);

	return new Promise((resolve, reject) => {
		loader.load(
			url,
			(tex) => {
				const configured = configurePhotoViewTexture(tex);
				cache.set(url, configured);
				resolve(configured);
			},
			undefined,
			reject,
		);
	});
}
