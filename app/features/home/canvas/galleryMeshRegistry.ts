import {
  Group,
  Mesh,
  PlaneGeometry,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector4,
  type Camera,
  type Intersection,
} from 'three'
import { createGalleryPhotoMaterial } from '~/features/home/canvas/materials'
import { isHomeSplashLayoutActive, type HomeState } from '~/features/home/state/homeState'
import {
  galleryAtlasKeyFromSrc,
  getGalleryAtlasSprite,
  getGalleryAtlasTexture,
  loadGalleryAtlasTexture,
  spriteToUvRect,
} from '~/features/home/lib/galleryAtlasTexture'
import { getImageAspect, isFrameVisible, type GalleryFrameSpec } from '~/features/home/lib/galleryLayout'
import {
  getFrameScreenRect,
  getFrameSpecById,
  getFrameWorldRect,
  listAllFrameSpecs,
  recomputeGalleryMetrics,
} from '~/features/home/lib/galleryLayoutStore'
import { getGalleryMode, getGalleryModeChangePow } from '~/features/home/lib/galleryStore'
import type { ScrollPower } from '~/features/home/lib/jsScroll'

export type GalleryMeshEntry = {
  layoutId: string
  mesh: Mesh
}

type CategoryGroup = {
  group: Group
  elements: GalleryMeshEntry[]
}

const MESH_BATCH_SIZE = 8
const PLANE_SEGMENTS = 16

export type GalleryEffectUniforms = {
  u_type: { value: number }
  scroll_pow: { value: number }
  modeChangePow: { value: number }
  mode: { value: number }
  device: { value: number }
}

export type GalleryMeshRegistryOptions = {
  scene: Scene
  isMobile: boolean
  pm: { value: number }
  getHomeState: () => HomeState
}

/**
 * Gallery photo meshes positioned from computed layout (not DOM measure).
 */
export class GalleryMeshRegistry {
  readonly pm: { value: number }
  readonly effectUniforms: GalleryEffectUniforms = {
    u_type: { value: 1 },
    scroll_pow: { value: 0 },
    modeChangePow: { value: 0 },
    mode: { value: 0 },
    device: { value: 0 },
  }

  private readonly scene: Scene
  private atlasReady = false
  private readonly meshedIds = new Set<string>()
  private readonly pendingIds: string[] = []
  private readonly groups: Record<string, CategoryGroup> = {
    cateInterior: { group: new Group(), elements: [] },
    catePortrait: { group: new Group(), elements: [] },
    cateLandscape: { group: new Group(), elements: [] },
  }
  private initRaf = 0
  private time = 0
  private wallHiddenForPhotoView = false
  private lastScrollPower: ScrollPower | null = null
  private readonly getHomeState: () => HomeState

  constructor({ scene, isMobile, pm, getHomeState }: GalleryMeshRegistryOptions) {
    this.scene = scene
    this.pm = pm
    this.getHomeState = getHomeState
    this.effectUniforms.device.value = isMobile ? 0.5 : 0
  }

  init(onReady?: () => void) {
    for (const g of Object.values(this.groups)) {
      this.scene.add(g.group)
    }

    const queue = listAllFrameSpecs().map((spec) => spec.id)
    let index = 0

    const finishInit = () => {
      for (const id of [...this.pendingIds]) {
        this.createMeshForLayoutId(id)
      }
      this.pendingIds.length = 0
      onReady?.()
    }

    void loadGalleryAtlasTexture().then(() => {
      this.atlasReady = true
      const runStep = () => {
        const end = Math.min(index + MESH_BATCH_SIZE, queue.length)
        for (; index < end; index++) {
          this.createMeshForLayoutId(queue[index])
        }
        if (index < queue.length) {
          this.initRaf = requestAnimationFrame(runStep)
        } else {
          finishInit()
        }
      }
      runStep()
    })
  }

  syncMeshes() {
    recomputeGalleryMetrics()

    const liveIds = new Set(listAllFrameSpecs().map((s) => s.id))

    for (const g of Object.values(this.groups)) {
      const kept: GalleryMeshEntry[] = []
      for (const entry of g.elements) {
        if (!liveIds.has(entry.layoutId)) {
          g.group.remove(entry.mesh)
          entry.mesh.geometry.dispose()
          ;(entry.mesh.material as ShaderMaterial).dispose()
          this.meshedIds.delete(entry.layoutId)
          continue
        }
        kept.push(entry)
      }
      g.elements = kept
    }

    for (const spec of listAllFrameSpecs()) {
      this.createMeshForLayoutId(spec.id)
    }
  }

  effectTick(power: ScrollPower) {
    this.lastScrollPower = power
    for (const g of Object.values(this.groups)) {
      for (const entry of g.elements) {
        this.updateMesh(entry, power)
      }
    }

    this.effectUniforms.scroll_pow.value = power.pow1.value ?? 0
    this.effectUniforms.modeChangePow.value = getGalleryModeChangePow()
    this.effectUniforms.mode.value = getGalleryMode()
  }

  onResize() {
    recomputeGalleryMetrics()
    for (const g of Object.values(this.groups)) {
      for (const entry of g.elements) {
        this.applyLayoutToMesh(entry)
      }
    }
  }

  findEntryByLayoutId(layoutId: string): GalleryMeshEntry | null {
    for (const g of Object.values(this.groups)) {
      for (const entry of g.elements) {
        if (entry.layoutId === layoutId) return entry
      }
    }
    return null
  }

  pickWallMesh(ndcX: number, ndcY: number, camera: Camera) {
    const raycaster = new Raycaster()
    raycaster.setFromCamera(new Vector2(ndcX, ndcY), camera)
    const meshes: Mesh[] = []
    const map = new Map<Mesh, GalleryMeshEntry>()
    for (const g of Object.values(this.groups)) {
      for (const entry of g.elements) {
        if (!entry.mesh.visible) continue
        meshes.push(entry.mesh)
        map.set(entry.mesh, entry)
      }
    }
    const hits = raycaster.intersectObjects(meshes, false)
    if (hits.length === 0) return null
    const mesh = hits[0].object as Mesh
    return { entry: map.get(mesh)!, hit: hits[0] as Intersection }
  }

  setWallMeshesHidden(hidden: boolean) {
    if (hidden) {
      this.wallHiddenForPhotoView = true
      this.effectUniforms.u_type.value = 0
      for (const g of Object.values(this.groups)) {
        for (const { mesh } of g.elements) {
          mesh.visible = false
        }
      }
      return
    }
    this.restoreWallMeshes()
  }

  restoreWallMeshes(power?: ScrollPower) {
    this.wallHiddenForPhotoView = false
    this.effectUniforms.u_type.value = 1
    this.onResize()
    for (const g of Object.values(this.groups)) {
      for (const { mesh } of g.elements) {
        mesh.visible = true
      }
    }
    const tickPower = power ?? this.lastScrollPower
    if (tickPower) {
      this.effectTick(tickPower)
    }
  }

  destroy() {
    cancelAnimationFrame(this.initRaf)
    for (const g of Object.values(this.groups)) {
      g.group.traverse((obj) => {
        if (obj instanceof Mesh) {
          obj.geometry.dispose()
          ;(obj.material as ShaderMaterial).dispose()
        }
      })
      this.scene.remove(g.group)
    }
    this.atlasReady = false
    this.pendingIds.length = 0
    this.meshedIds.clear()
  }

  private uvRectForSpec(spec: GalleryFrameSpec): Vector4 | null {
    const key = galleryAtlasKeyFromSrc(spec.jsSrc)
    const sprite = getGalleryAtlasSprite(key)
    if (!sprite) return null
    return spriteToUvRect(sprite)
  }

  private applyLayoutToMesh(entry: GalleryMeshEntry) {
    const world = getFrameWorldRect(entry.layoutId)
    const spec = getFrameSpecById(entry.layoutId)
    if (!world || !spec) return

    this.resizeGeometry(entry.mesh, world.width, world.height)
    entry.mesh.position.set(world.x, world.y, entry.mesh.position.z)

    const frameAspect = world.width / world.height
    const imgAspect = getImageAspect(spec.image)
    const u = (entry.mesh.material as ShaderMaterial).uniforms
    u.vUvScale.value.set(
      frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
      frameAspect > imgAspect ? imgAspect / frameAspect : 1,
    )
  }

  private addToGroup(mesh: Mesh, category: string, entry: GalleryMeshEntry) {
    const key =
      (
        {
          interior: 'cateInterior',
          portrait: 'catePortrait',
          landscape: 'cateLandscape',
        } as const
      )[category as 'interior' | 'portrait' | 'landscape'] ?? 'cateInterior'
    this.groups[key].group.add(mesh)
    this.groups[key].elements.push(entry)
  }

  private createMeshForLayoutId(layoutId: string) {
    if (this.meshedIds.has(layoutId)) return

    const spec = getFrameSpecById(layoutId)
    if (!spec) return

    const atlas = getGalleryAtlasTexture()
    const uvRect = this.uvRectForSpec(spec)
    if (!this.atlasReady || !atlas || !uvRect) {
      if (!this.pendingIds.includes(layoutId)) {
        this.pendingIds.push(layoutId)
      }
      return
    }

    const world = getFrameWorldRect(layoutId)
    if (!world) return

    const geo = new PlaneGeometry(world.width, world.height, PLANE_SEGMENTS, PLANE_SEGMENTS)
    const mesh = new Mesh(geo, createGalleryPhotoMaterial(atlas, uvRect))
    mesh.position.set(world.x, world.y, 0)
    mesh.userData.layoutId = layoutId

    const entry: GalleryMeshEntry = { layoutId, mesh }
    this.addToGroup(mesh, spec.category.toLowerCase(), entry)
    this.meshedIds.add(layoutId)
  }

  private resizeGeometry(mesh: Mesh, width: number, height: number) {
    const geo = mesh.geometry as PlaneGeometry
    if (Math.abs(geo.parameters.width - width) < 1 && Math.abs(geo.parameters.height - height) < 1) {
      return
    }
    geo.dispose()
    mesh.geometry = new PlaneGeometry(width, height, PLANE_SEGMENTS, PLANE_SEGMENTS)
    mesh.scale.set(1, 1, 1)
  }

  private applyLayoutToMeshEntry(entry: GalleryMeshEntry, power: ScrollPower, visible = true) {
    const spec = getFrameSpecById(entry.layoutId)
    const world = getFrameWorldRect(entry.layoutId)
    if (!spec || !world) return

    this.resizeGeometry(entry.mesh, world.width, world.height)
    const frameAspect = world.width / world.height
    const imgAspect = getImageAspect(spec.image)
    const geo = entry.mesh.geometry as PlaneGeometry
    const scaleX =
      frameAspect > imgAspect
        ? (frameAspect / imgAspect) * (world.height / geo.parameters.height)
        : world.width / geo.parameters.width
    const scaleY =
      frameAspect > imgAspect
        ? world.height / geo.parameters.height
        : (imgAspect / frameAspect) * (world.width / geo.parameters.width)

    const u = (entry.mesh.material as ShaderMaterial).uniforms
    u.vUvScale.value.set(
      frameAspect > imgAspect ? 1 : frameAspect / imgAspect,
      frameAspect > imgAspect ? imgAspect / frameAspect : 1,
    )
    u.pw.value = (power.pow2.value ?? 0) * this.pm.value * getGalleryMode()
    u.mode.value = 1
    entry.mesh.scale.set(scaleX, scaleY, 1)
    entry.mesh.position.set(world.x, world.y, 0)
    entry.mesh.visible = visible
  }

  private updateMesh(entry: GalleryMeshEntry, power: ScrollPower) {
    if (this.wallHiddenForPhotoView) {
      entry.mesh.visible = false
      return
    }

    const spec = getFrameSpecById(entry.layoutId)

    if (isHomeSplashLayoutActive(this.getHomeState())) {
      this.applyLayoutToMeshEntry(entry, power, true)
      return
    }

    const screen = getFrameScreenRect(entry.layoutId)
    if (!spec || !screen) return

    this.time += 1e-4
    this.applyLayoutToMeshEntry(entry, power, isFrameVisible(screen))
  }
}
