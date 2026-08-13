/**
 * Ship Lighting — single source of truth for all ship presentation lighting.
 *
 * WHY ONE RIG FOR BOTH THE VIEWER AND THE LIVE SCENE:
 * The Models Browser owns a separate WebGLRenderer and Scene from the game
 * (main.js creates the game renderer; modelsbrowser.js creates its own).
 * Both renderers must configure tone-mapping independently, and both scenes
 * must receive the same lights. When light values live in two places they
 * drift: the viewer previously lacked a hemisphere fill and never received
 * scene.environmentIntensity, so dark-iron hulls appeared near-black in the
 * browser while reading correctly in flight. A single frozen constant
 * (SHIP_LIGHT_RIG) plus two helpers (addShipLightRig, applyShipToneMapping)
 * give every caller identical parameters with one place to tune them.
 */

import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

/**
 * Frozen lighting parameters shared by the Models Browser viewer and the
 * live game scene. All intensities, colours, tone-mapping settings, and the
 * IBL boost factor live here and nowhere else.
 *
 * Values chosen to lift shadowed dark-iron hull faces above black while
 * keeping space dark and emissive equipment the brightest element on the ship:
 *
 * - keyIntensity 3.4 — strong directional from upper-front-right; strikes
 *   primary faces cleanly and establishes the hull read.
 * - fillSkyColor / fillGroundColor — cool blue-grey sky over warm dark earth
 *   gives unlit faces a value gradient instead of a uniform floor; the cool
 *   hue reads as space ambient, the warm ground prevents undersides going black.
 * - fillIntensity 2.0 — within the 1.6–2.4 design range; matches the value
 *   measured to lift ferrous-hull median luminance without crushing distinctions
 *   between armour, hull, recess, and trim steps.
 * - rimIntensity 0.65 — low-intensity cool back-light opposite the key; adds
 *   silhouette separation against space without competing with the key.
 * - ambientIntensity 0.18 — tiny floor keeps shadowed concavities from
 *   clipping to zero without flattening the normal-map response.
 * - environmentIntensity 1.8 — the HDR environment is authored at background
 *   strength 0.35, so its raw IBL contribution is weak; 1.8 recovers specular
 *   highlights and metalness response on hull panels.
 * - exposure 1.15 — ACESFilmicToneMapping at 1.0 crushes dark-iron linear
 *   values hard against 0; 1.15 lifts the shadow region enough for iron to
 *   read as metal without blowing emissive equipment or the star background.
 *
 * @type {Readonly<{
 *   keyIntensity: number,
 *   fillSkyColor: number, fillGroundColor: number, fillIntensity: number,
 *   rimColor: number, rimIntensity: number,
 *   ambientColor: number, ambientIntensity: number,
 *   environmentIntensity: number,
 *   exposure: number
 * }>}
 */
export const SHIP_LIGHT_RIG = Object.freeze({
  keyIntensity:         5.2,       // dominant: plane separation comes from the key
  fillSkyColor:         0x8ea6bd,  // cool blue-grey — space-ambient sky hemisphere
  fillGroundColor:      0x3a3124,  // warm dark earth — stops undersides going black
  fillIntensity:        1.35,      // supports the key; must not flatten form
  rimColor:             0x9cc4dc,  // cool blue — silhouette separation against space
  rimIntensity:         0.90,      // reads the far edge without lighting whole faces
  ambientColor:         0x2b3542,  // neutral dark — minimal concavity floor
  ambientIntensity:     0.16,
  environmentIntensity: 2.20,      // the HDR is authored at 0.35 strength; recover IBL
  exposure:             1.25,      // lifts the ACESFilmic shadow floor off black
});

/**
 * Create, configure, and add the full four-light ship rig to `target`
 * (a THREE.Scene or THREE.Group). All values come from SHIP_LIGHT_RIG.
 *
 * Light layout:
 *   key  — DirectionalLight at (0.35, 0.7, 0.6): upper-front-right, like a
 *           high system star. Defines the primary hull read.
 *   fill — HemisphereLight: cool sky, warm ground. Lifts unlit faces with a
 *           hue gradient rather than a flat floor.
 *   rim  — DirectionalLight at (-0.35, -0.7, -0.6): exactly opposite the key.
 *           Cool colour; low intensity for silhouette separation against space.
 *   ambient — AmbientLight: tiny omnidirectional floor; concavity safety net.
 *
 * @param {THREE.Object3D} target  Scene or group that receives the lights.
 * @param {{ keyColor?: number }} [options]
 *   keyColor — hex colour for the key DirectionalLight (default 0xffffff).
 *   Pass the system sun colour to tint the key per faction/system.
 * @returns {{ key: THREE.DirectionalLight, fill: THREE.HemisphereLight,
 *             rim: THREE.DirectionalLight, ambient: THREE.AmbientLight }}
 *   Caller retains these references for tracking and disposal when the scene
 *   or system is torn down.
 */
export function addShipLightRig(target, options = {}) {
  const keyColor = options.keyColor ?? 0xffffff;

  // Primary key — upper-front-right; defines the hull read.
  const key = new THREE.DirectionalLight(keyColor, SHIP_LIGHT_RIG.keyIntensity);
  key.position.set(0.35, 0.7, 0.6);
  target.add(key);
  target.add(key.target); // keep target in the scene so world transforms stay consistent

  // Hemisphere fill — cool sky over warm ground; lifts unlit faces with a
  // value gradient instead of a uniform floor.
  const fill = new THREE.HemisphereLight(
    SHIP_LIGHT_RIG.fillSkyColor,
    SHIP_LIGHT_RIG.fillGroundColor,
    SHIP_LIGHT_RIG.fillIntensity,
  );
  target.add(fill);

  // Cool rim — directly opposite the key; silhouette separation against space.
  const rim = new THREE.DirectionalLight(SHIP_LIGHT_RIG.rimColor, SHIP_LIGHT_RIG.rimIntensity);
  rim.position.set(-0.35, -0.7, -0.6);
  target.add(rim);
  target.add(rim.target);

  // Low ambient — omnidirectional concavity floor; does not flatten normal maps.
  const ambient = new THREE.AmbientLight(
    SHIP_LIGHT_RIG.ambientColor,
    SHIP_LIGHT_RIG.ambientIntensity,
  );
  target.add(ambient);

  return { key, fill, rim, ambient };
}

/**
 * Configure `renderer` output colour space, tone mapping, and exposure from
 * SHIP_LIGHT_RIG. Call once after creating each renderer — the game and
 * Models Browser each own their own renderer and must each be configured.
 *
 * @param {THREE.WebGLRenderer} renderer
 */
export function applyShipToneMapping(renderer) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = SHIP_LIGHT_RIG.exposure;
}

// Per-renderer promise cache. The PMREMGenerator result is expensive to build
// and identical for every scene on the same renderer; keying on the renderer
// (WeakMap, so it cannot prevent GC) avoids both cross-renderer texture sharing
// (different GL contexts) and redundant double-loads when several scenes share
// one renderer.
const environments = new WeakMap();

/**
 * Apply the shared ship HDR reflection environment to `scene` without
 * changing the visible background. Also sets scene.environmentIntensity
 * from SHIP_LIGHT_RIG so the environment map's IBL contribution reaches
 * its intended level (the HDR is authored at 0.35 background strength and
 * needs the multiplier to lift specular and metalness response on hulls).
 *
 * The environment texture promise is cached per renderer; calling this
 * function multiple times with the same renderer (for different scenes,
 * or after a system load) is safe and incurs no extra GPU work.
 *
 * @param {THREE.WebGLRenderer} renderer
 * @param {THREE.Scene} scene
 */
export function applyShipLighting(renderer, scene) {
  let environment = environments.get(renderer);
  if (!environment) {
    environment = new RGBELoader()
      .loadAsync('/assets/environment/ship-reflection-rig.hdr')
      .then((texture) => {
        const pmrem = new THREE.PMREMGenerator(renderer);
        const result = pmrem.fromEquirectangular(texture).texture;
        texture.dispose();
        pmrem.dispose();
        return result;
      });
    environments.set(renderer, environment);
  }
  environment
    .then((texture) => {
      scene.environment = texture;
      scene.environmentIntensity = SHIP_LIGHT_RIG.environmentIntensity;
    })
    .catch((error) => console.error('Ship reflection rig load failed', error));
}
