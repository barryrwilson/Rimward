import * as THREE from 'three';

/**
 * Wave 52 procedural rock surface detail injected into the shared
 * MeshStandardMaterial. No texture files, no UVs: an IcosahedronGeometry's
 * UVs are seamy and unusable, so the pattern is evaluated from the
 * OBJECT-space position instead. Because vRockPos is the raw `position`
 * attribute, the pattern is glued to the rock and tumbles with it rather
 * than swimming through it; a per-instance seed hashed from the instance
 * translation (instanceMatrix[3].xyz) stops N instances of one shared
 * geometry from wearing the identical pattern.
 *
 * The detail is a MULTI-SCALE stack, because a single low-frequency fBm
 * reads as a soft cloud at mid distance, not as rock:
 *
 *   - BASE field: profile.surface.scale is the base frequency in object
 *     space over the unit-radius body. rockFbm5 layers 5 octaves above it
 *     (lacunarity 2.1, gain 0.5), so the finest octave sits near
 *     scale * 2.1^4 ~ 175 cells across the body — visible grain, not haze.
 *   - GRAIN field: a second, domain-offset fBm at 4x base frequency
 *     (3 octaves, finest ~160 cells). It drives ONLY the bump gradient and
 *     the roughness variance, so micro-pitting and roughness sparkle are
 *     decorrelated from the albedo patches — on real rock those are
 *     different physical scales (regolith patches vs. surface micro-relief).
 *   - ALBEDO: the base field is sampled at a domain-warped coordinate and
 *     folded into a RIDGED signal (1 - abs(2*f - 1)), re-centred and
 *     stretched so its mean over the sphere is ~0.5. Ridged noise produces
 *     sharp crevice lines and patchy plateaus instead of a blurry mottle.
 *     mix(ROCK_DARK, ROCK_LIGHT, tone) has per-channel mean 1.0 (both
 *     colours are pre-divided by their mean below), so the pattern
 *     modulates AROUND the per-instance setColorAt tint (heat glow,
 *     depletion) instead of replacing it. The final multiplier is clamped
 *     to [0.30, 1.55] for REGOLITH only — that is the frozen pilot look.
 *     Every other style gets the CALM variant instead: the ridged signal
 *     rides a fine-weighted fBm (rockFbm5Fine — energy shifted out of the
 *     two lowest octaves into the top three, so the break-up reads as rock
 *     grain rather than low-frequency paint blobs), the warp, ridge gain
 *     and cavity strength are reduced, a per-style tone squash flattens
 *     styles whose material must stay near-flat (ember glass, stone), and
 *     the clamp tightens to [0.74, 1.30]. The applied multiplier is kept
 *     in a running variable (rockMult); every style albedo edit re-clamps
 *     the product to [0.70, 1.34] through rockApplyAlbedo, so features
 *     can never stack into confetti or mud. Measured offline against a JS
 *     port over 8192 unit-sphere samples across 4 instance seeds: channel-averaged
 *     multiplier min >= 0.70, max <= 1.32, mean within 0.03 of 1.0,
 *     stddev <= 0.11 for the seven calm ores and <= 0.13 for brine ice
 *     (its pale-skewed distribution is slightly wider by design).
 *   - CAVITY: a cheap fake AO. Where the 2-octave low-frequency field is
 *     in a trough (crater bowls, crevice floors) diffuseColor darkens by
 *     up to min(contrast * 0.8, 0.35) for regolith; the calm variant uses
 *     a gentler slope and a per-style cap of 0.05-0.10. Only troughs below
 *     CAV_MID darken, so the sphere-wide mean stays near 1.0.
 *   - BUMP: central-difference gradient of the GRAIN field, transformed
 *     object->view with the per-instance normal matrix, projected onto the
 *     tangent plane. The gain is DERIVED FROM THE NOISE FREQUENCY, not
 *     hand-set: gradient magnitude scales linearly with frequency, and the
 *     measured mean |grad| per unit frequency of rockFbm3 is ~0.0608, so
 *     ROCK_BUMP_GAIN = (bump * 0.22 slope units) / (grainFreq * 0.0608).
 *     The tangent tilt is then clamped to length 0.85 < 1, so the perturbed
 *     normal always keeps a positive dot with the geometric normal —
 *     silhouette-adjacent fragments can never flip to face away.
 *   - ROUGHNESS: +/- roughVar from the grain field around the material
 *     roughness, clamped to [0.35, 1.0]. Rock is never glossy.
 *
 * That stack is the SHARED BASE every ore gets. On top of it,
 * profile.surface.style selects one entry in SURFACE_STYLES below — a
 * plain descriptor map (style name -> optional pars/color/roughness/
 * metalness/normal/late snippets plus a cache-key tail), so adding a style
 * later is data, not surgery:
 *
 *   regolith  rawOre — the approved pilot look; the aggressive base stack
 *             verbatim. Its generated shader is FROZEN: the regolith
 *             descriptor is empty and the calm variant is skipped, so its
 *             program stays byte-identical to the pilot.
 *   metal     slagIron / voidPlatinum — coherent oxidation patches: a
 *             thresholded low-frequency domain-warped field covers ~20-30%
 *             of the surface with soft but definite edges; inside a patch
 *             albedo goes to rustColor, roughness toward 0.9, metalness
 *             toward 0.15; outside, bare metal keeps the material's own
 *             response and dominates.
 *   ice       brineIce — pale, near-white ice: the surface sits at the
 *             light end of the recipe pair, fine crystalline frost speckle
 *             (9x recipe scale) textures albedo and bump, and the blue
 *             darkColor appears only in the low-frequency cavity troughs
 *             (deep ice absorbs — light travels further). Roughness is
 *             bimodal over a low-frequency facet field: broad polished
 *             facets (0.10-0.20, hard specular) vs frosted patches
 *             (0.75-0.95). No soft blue blobs.
 *   facet     chromeSalt — a Worley-style cell field over the 27
 *             neighbouring lattice cells at 1.2x the recipe scale: packed
 *             salt grains, dark rough boundaries, bright smooth interiors,
 *             and a bump that follows the cells, not the fBm.
 *   vein      gildvein — connected narrow gold bands: a level-set band of
 *             a domain-warped low-frequency field (~12-14% coverage, mean
 *             great-circle run length ~14x sample spacing — bands, not
 *             dots); albedo to veinColor, metalness toward 1.0, roughness
 *             to 0.25, no emissive, so the metal reads as enclosed in the
 *             rock.
 *   ember     emberglass — thin bright crack lines (width ~crackWidth,
 *             coverage ~7%) on nearly black glass: emissive crackColor *
 *             crackGlow only inside the crack cores, a faint darkened halo
 *             around them, smooth dark glass elsewhere (tone squash 0.3).
 *   bloom     livingRock — soft organic mottle plus a faint darker net of
 *             growth seams (level-set band, ~10% coverage) so the body has
 *             structure, plus a faint rim-ward brightening centred on its
 *             spherical mean so the albedo mean holds.
 *   wake      wakeglass — deep violet glass with narrow luminous filaments
 *             (level-set band of width ~glowWidth, coverage ~10%, emissive
 *             only), low roughness, faint fresnel-ish edge lift (mean-
 *             centred) so the dark body stays readable at the silhouette.
 *
 * Contract: profile.surface is OPTIONAL. When it is falsy the material is
 * returned untouched. When present, the material is patched in place via
 * onBeforeCompile with fragment injections plus one vertex wiring, each
 * anchored on a verbatim `#include <...>` line quoted from
 * node_modules/three/src/renderers/shaders/ShaderLib/meshphysical.glsl.js
 * (verified for three 0.170.0):
 *
 *   vertex   `#include <common>`               varyings
 *   vertex   `#include <begin_vertex>`         vRockPos / vRockSeed / normal mat
 *   fragment `#include <common>`               varyings + noise/fBm functions
 *   fragment `#include <color_fragment>`       albedo + cavity (diffuseColor in
 *                                              scope, instance tint already
 *                                              applied via vColor)
 *   fragment `#include <roughnessmap_fragment>` ± roughVar (roughnessFactor
 *                                              declared by the chunk itself)
 *   fragment `#include <metalnessmap_fragment>` style metalness edits
 *                                              (metal/vein only;
 *                                              metalnessFactor declared by
 *                                              the chunk itself)
 *   fragment `#include <normal_fragment_maps>` bump via grain gradient
 *                                              (`normal` declared by
 *                                              normal_fragment_begin above it)
 *   fragment `#include <emissivemap_fragment>`  style emissive/rim edits
 *                                              (ember/wake/bloom;
 *                                              totalEmissiveRadiance and the
 *                                              perturbed `normal` are both in
 *                                              scope here, diffuseColor is
 *                                              still unconsumed by lighting)
 *
 * Variables declared at main() scope by one injection stay in scope for the
 * later anchors (chunk order in the meshphysical main is color -> roughness
 * -> metalness -> normal -> emissive), so the styles compute their masks
 * once at color time and reuse them downstream.
 *
 * All GLSL is ES 1.00-safe for the WebGL2 backport three uses: the hash is
 * the float-only Hoskins hash13 (no integer bit operators), there are no
 * switch statements, and every loop (fBm octaves, the facet cell search)
 * has a literal compile-time bound.
 *
 * The recipe values are baked into the injected source as GLSL literals —
 * no uniforms, no textures, no module-level GL state — so dispose() and
 * rebuilds leak nothing. customProgramCacheKey is overridden with a string
 * derived from the style name plus every recipe-driven literal, so three.js
 * never shares one compiled program across differently-parameterised rock
 * materials.
 *
 * The boot harness (scripts/boot-test.mjs) runs headless with no WebGL
 * context, so onBeforeCompile never fires there; this module touches no
 * document/window/canvas/renderer at import time.
 */

// Formats a JS number as a GLSL float literal: `3` must compile as `3.0`.
function glslFloat(n) {
  const s = String(n);
  return /[.eE]/.test(s) ? s : s + '.0';
}

// String-replaces one anchor inside a shader source. A missing anchor means
// the pinned three.js shader chunks changed under us — failing loudly here
// beats a silently no-op replace that renders the old flat glass look.
function inject(src, anchor, code) {
  if (!src.includes(anchor)) {
    throw new Error(`rock-surface: shader anchor missing from three program: ${anchor}`);
  }
  return src.replace(anchor, () => code);
}

// Albedo patch colours (rust, gold veins) are balanced against their OWN
// channel mean, not the recipe mean: mixing toward a channel-balanced
// colour at any coverage keeps the channel-averaged albedo multiplier at
// 1.0 — the same contract the recipe-mean-normalised dark/light pair meets
// per channel — so patch coverage can never wash the ore out or darken it
// into mud.
function balancedColorLit(hex) {
  const c = new THREE.Color(hex);
  const m = (c.r + c.g + c.b) / 3;
  return `vec3( ${glslFloat(c.r / m)}, ${glslFloat(c.g / m)}, ${glslFloat(c.b / m)} )`;
}

// Emissive colours (crack glow, wake filaments) are light, not albedo: they
// are baked as plain linear-space vec3 literals, unnormalised.
function emissiveColorLit(hex) {
  const c = new THREE.Color(hex);
  return `vec3( ${glslFloat(c.r)}, ${glslFloat(c.g)}, ${glslFloat(c.b)} )`;
}

/**
 * Style descriptors. Every field is optional; each snippet is a function of
 * the surface recipe `s` and the baked colour literals `L`, returning GLSL
 * that is concatenated onto the matching shared injection. Styles that need
 * the metalness or emissive anchors supply `metalness` / `late`; the anchor
 * line itself is prepended by applyRockSurface. `key` returns the
 * style-specific cache-key tail so two ores that share a style but differ
 * in colour never share a compiled program. `toneSquash` (default 1.0)
 * flattens the calm base tone toward its mean for styles whose material
 * must stay near-flat; `cavCap` (default 0.10) caps cavity darkening.
 *
 * All magic constants below were tuned offline against a JS port of this
 * exact noise stack sampled over 8192 unit-sphere points across 4 instance seeds: every
 * non-regolith ore's channel-averaged albedo multiplier keeps a mean
 * within 0.03 of 1.0, a stddev <= 0.11 (brine ice: <= 0.13, pale-skewed
 * by design), and a min/max inside 0.70..1.32
 * (no ore renders as confetti patches, none washes out). Feature coverage:
 * rust 22-26%, veins ~14%, ember cracks ~7%, wake filaments ~10%.
 */
const SURFACE_STYLES = {
  // rawOre — the approved pilot look. Empty on purpose: the shared base IS
  // the regolith style, and an empty descriptor keeps its generated shader
  // byte-identical to what the user approved.
  regolith: {},

  // slagIron / voidPlatinum — fractured metal slab with coherent oxidation.
  metal: {
    toneSquash: 0.85,
    pars: (s, L) => /* glsl */`

// --- metal: coherent oxidation patches ---
// The patch field is a low-frequency domain-warped fBm thresholded through
// a smoothstep band, so oxidation forms large coherent patches with soft
// but definite edges — never per-pixel speckle. ROCK_RUST is channel-mean
// balanced (see balancedColorLit), so patch coverage cannot shift the
// albedo mean.
const vec3 ROCK_RUST = ${L.rust};
const vec3 ROCK_RUST_OFF = vec3( 7.3, 29.1, 13.7 );
`,
    color: () => /* glsl */`
// Oxidation patches: threshold the warped low-frequency field; ~20-30%
// coverage measured over the sphere, bare metal dominates. ROCK_RUST is
// mean-neutral per channel average, so the factor bypasses
// rockApplyAlbedo's clamp: the rust hue saturation IS the feature.
vec3 rockRustP = rockP * 0.45 + ROCK_RUST_OFF + vec3( 0.31, -0.23, 0.37 ) * ( ( rockLow - 0.5 ) * 1.1 );
float rockRust = smoothstep( 0.56, 0.64, rockFbm2( rockRustP ) );
vec3 rockRustFactor = mix( vec3( 1.0 ), ROCK_RUST, rockRust * 0.9 );
rockMult *= rockRustFactor;
diffuseColor.rgb *= rockRustFactor;
`,
    roughness: () => /* glsl */`
// Inside a patch oxidation is rough (~0.9); outside, the bare metal keeps
// the material's own low roughness (relaxed below the shared 0.35 floor),
// so it still reads as metal, not stone.
roughnessFactor = clamp( mix( roughnessFactor - 0.15, 0.9, rockRust ), 0.15, 1.0 );
`,
    metalness: () => /* glsl */`
// Rust is an oxide: the metallic response drops toward 0.15 in patches.
metalnessFactor = mix( metalnessFactor, 0.15, rockRust );
`,
    key: (s) => `|rust:${s.rustColor}`,
  },

  // brineIce — pale spalled ice: near-white frost faces, blue only in the
  // deep troughs where light travels further, bimodal polish/frost
  // roughness. toneSquash 0.95 and cavCap 0.08 are baked into brineIce's
  // copy of the calm base only.
  ice: {
    toneSquash: 0.95,
    cavCap: 0.08,
    pars: (s, L) => /* glsl */`

// --- ice: pale frost, blue depth, bimodal polish ---
// Three fields, three scales, no mid-frequency blob field anywhere:
//   - SPECKLE at 9x the recipe scale (~117 cells across the body, far above
//     ROCK_SCALE): fine crystalline frost grain for albedo and bump.
//   - POLISH at 0.45x the recipe scale: broad low-frequency facets that
//     split the surface into polished and frosted patches.
//   - DEPTH keys off the shared cavity signal (the low-frequency troughs
//     of rockLow, i.e. the same field that drives the fake AO), so blue
//     appears exactly where the surface dips — never as free-floating
//     blobs.
const float ROCK_ICE_SPECK_FREQ = 9.0;
const float ROCK_ICE_SPECK_AMP = 0.32;
const float ROCK_ICE_DEEP_MID = 0.10;
const float ROCK_ICE_DEEP_GAIN = 2.0;
const float ROCK_ICE_LIFT = 0.075;
const float ROCK_ICE_DEEP = 0.30;
const float ROCK_ICE_POLISH_FREQ = 0.45;
const vec3 ROCK_FROST_OFF = vec3( 61.7, 23.3, 41.9 );
const vec3 ROCK_POLISH_OFF = vec3( 5.3, 47.1, 29.9 );
// Speckle bump: ROCK_ICE_SPECK_EPS is a quarter speckle cell in rockP
// units (small enough to resolve the grain, large enough for fp32), and
// the gain mirrors the shared grain-bump derivation: the measured mean
// |grad| per unit frequency of a single rockNoise octave is ~0.52 (JS
// port, 20k samples), so bump 1.1 targets a mean tangent tilt of ~0.24
// slope units — visible frost grain, still far under the 0.85 clamp.
const float ROCK_ICE_SPECK_EPS = 0.25 / ROCK_ICE_SPECK_FREQ;
const float ROCK_ICE_SPECK_BUMP = ( ROCK_BUMP * 0.22 ) / ( ROCK_ICE_SPECK_FREQ * 0.52 );
`,
    color: () => /* glsl */`
// Depth cue: rockCavity (the shared low-frequency trough mask) drives the
// blue. Deep ice absorbs — light travels further through it — so troughs
// mix toward ROCK_DARK while flat faces lift faintly toward ROCK_LIGHT.
// The lift and the depth drop are balanced so their channel-averaged
// means cancel over the sphere: the albedo multiplier keeps its ~1.0
// mean but the distribution skews pale, with the blue confined to the
// lower tail (measured: 16% of samples below 0.9, JS port, 16k samples).
float rockSpeck = rockNoise( rockP * ROCK_ICE_SPECK_FREQ + ROCK_FROST_OFF );
float rockDeep = clamp( ( rockCavity - ROCK_ICE_DEEP_MID ) * ROCK_ICE_DEEP_GAIN, 0.0, 1.0 );
vec3 rockIceFactor = mix(
	mix( vec3( 1.0 ), ROCK_LIGHT, ROCK_ICE_LIFT ),
	mix( vec3( 1.0 ), ROCK_DARK, ROCK_ICE_DEEP ),
	rockDeep );
// Frost speckle: fine crystalline grain, mean-centred on the noise mean
// (0.5), so it textures the albedo without shifting its mean.
rockIceFactor *= 1.0 + ( rockSpeck - 0.5 ) * ROCK_ICE_SPECK_AMP;
rockApplyAlbedo( rockMult, diffuseColor.rgb, rockIceFactor );
`,
    roughness: () => /* glsl */`
// Bimodal roughness: the polish mask follows a LOW-frequency field, so the
// surface splits into broad polished facets and frosted patches with
// coherent boundaries — never per-pixel sparkle. Polished facets sit at
// 0.10-0.20 (a hard specular highlight can catch); frosted patches at
// 0.75-0.95. The grain field adds micro variation inside each mode. The
// shared [0.35, 1.0] floor is deliberately re-opened for the polish mode.
float rockPolish = smoothstep( 0.50, 0.60, rockFbm2( rockP * ROCK_ICE_POLISH_FREQ + ROCK_POLISH_OFF ) );
float rockFrostR = 0.85 + ( rockG - 0.5 ) * 0.20;
float rockPolishR = 0.15 + ( rockG - 0.5 ) * 0.10;
roughnessFactor = clamp( mix( rockFrostR, rockPolishR, rockPolish ), 0.08, 1.0 );
`,
    normal: () => /* glsl */`
{
	// Frost-grain bump: central differences of the speckle field at its own
	// frequency, then the same object->view transform, tangent projection
	// and 0.85 tilt clamp contract as the shared grain bump above.
	vec3 rockSpeckGrad = vec3(
		rockNoise( ( rockP + vec3( ROCK_ICE_SPECK_EPS, 0.0, 0.0 ) ) * ROCK_ICE_SPECK_FREQ + ROCK_FROST_OFF )
			- rockNoise( ( rockP - vec3( ROCK_ICE_SPECK_EPS, 0.0, 0.0 ) ) * ROCK_ICE_SPECK_FREQ + ROCK_FROST_OFF ),
		rockNoise( ( rockP + vec3( 0.0, ROCK_ICE_SPECK_EPS, 0.0 ) ) * ROCK_ICE_SPECK_FREQ + ROCK_FROST_OFF )
			- rockNoise( ( rockP - vec3( 0.0, ROCK_ICE_SPECK_EPS, 0.0 ) ) * ROCK_ICE_SPECK_FREQ + ROCK_FROST_OFF ),
		rockNoise( ( rockP + vec3( 0.0, 0.0, ROCK_ICE_SPECK_EPS ) ) * ROCK_ICE_SPECK_FREQ + ROCK_FROST_OFF )
			- rockNoise( ( rockP - vec3( 0.0, 0.0, ROCK_ICE_SPECK_EPS ) ) * ROCK_ICE_SPECK_FREQ + ROCK_FROST_OFF )
	) / ( 2.0 * ROCK_ICE_SPECK_EPS );
	vec3 rockSpeckTilt = vRockNrmMat * ( rockSpeckGrad * ROCK_ICE_SPECK_BUMP );
	rockSpeckTilt -= dot( rockSpeckTilt, normal ) * normal;
	float rockSpeckTiltLen = length( rockSpeckTilt );
	if ( rockSpeckTiltLen > 0.85 ) {
		rockSpeckTilt *= 0.85 / rockSpeckTiltLen;
	}
	normal = normalize( normal - rockSpeckTilt );
}
`,
    key: () => '',
  },

  // chromeSalt — packed salt-grain cluster from a Worley-style cell field.
  facet: {
    pars: (s, L) => /* glsl */`

// --- facet: packed-grain cell field ---
// Nearest (F1) and second-nearest (F2) feature distances over the 27
// neighbouring lattice cells, feature points jittered inside their cells by
// the float-only hash. F2-F1 vanishes at grain boundaries. The offset
// vector R1 to the nearest feature is kept because the dome height -F1 has
// gradient 2*R1 (per cell unit), so the bump follows the CELL BOUNDARIES,
// not the fBm. Mean |2*R1| over the jittered lattice is ~0.7 cell units,
// so the gain mirrors the grain-bump derivation: ROCK_BUMP is in slope
// units of 0.22 and the 2*ROCK_CELL_FREQ chain-rule factor cancels out.
// Cells run at 1.2x the recipe scale so the grains read as packed salt.
const float ROCK_CELL_FREQ = ROCK_SCALE * 1.2;
const float ROCK_CELL_BUMP_GAIN = ( ROCK_BUMP * 0.44 ) / 0.7;
`,
    color: () => /* glsl */`
// Nearest-feature search over the 27 neighbouring cells (ES 1.00-safe:
// literal loop bounds, no arrays, float-only hashes).
vec3 rockCellP = vRockPos * ROCK_CELL_FREQ + vec3( vRockSeed * 13.1, vRockSeed * 7.7, vRockSeed * 19.3 );
vec3 rockCellI = floor( rockCellP );
vec3 rockCellF = fract( rockCellP );
float rockF1 = 8.0;
float rockF2 = 8.0;
vec3 rockR1 = vec3( 0.0 );
for ( int rockCx = -1; rockCx <= 1; rockCx ++ ) {
	for ( int rockCy = -1; rockCy <= 1; rockCy ++ ) {
		for ( int rockCz = -1; rockCz <= 1; rockCz ++ ) {
			vec3 rockCellG = vec3( float( rockCx ), float( rockCy ), float( rockCz ) );
			vec3 rockCellId = rockCellI + rockCellG;
			vec3 rockR = rockCellG + vec3(
				rockHash( rockCellId ),
				rockHash( rockCellId + vec3( 19.19, 7.31, 43.7 ) ),
				rockHash( rockCellId + vec3( 47.47, 29.9, 13.13 ) )
			) - rockCellF;
			float rockD = dot( rockR, rockR );
			if ( rockD < rockF1 ) {
				rockF2 = rockF1;
				rockF1 = rockD;
				rockR1 = rockR;
			} else if ( rockD < rockF2 ) {
				rockF2 = rockD;
			}
		}
	}
}
// Grain boundaries darken slightly, grain interiors brighten into a rounded
// dome — kept shallow so the packed grains read as one salt material.
float rockEdge = 1.0 - smoothstep( 0.0, 0.05, rockF2 - rockF1 );
float rockDome = 1.0 - clamp( rockF1 * 2.6, 0.0, 1.0 );
rockApplyAlbedo( rockMult, diffuseColor.rgb, vec3( 0.98 + 0.10 * rockDome - 0.06 * rockEdge ) );
`,
    roughness: () => /* glsl */`
// Grain boundaries roughen; interiors stay smooth salt faces below the
// shared 0.35 floor.
roughnessFactor = clamp( roughnessFactor + rockEdge * 0.5 - ( 1.0 - rockEdge ) * 0.18, 0.10, 1.0 );
`,
    normal: () => /* glsl */`
{
	// Cell bump: the dome height -F1 has gradient 2*R1 per cell unit, so
	// the tilt creases exactly along grain boundaries. Same tangent
	// projection and 0.85 tilt clamp contract as the grain bump above.
	vec3 rockCellTilt = vRockNrmMat * rockR1 * ROCK_CELL_BUMP_GAIN;
	rockCellTilt -= dot( rockCellTilt, normal ) * normal;
	float rockCellTiltLen = length( rockCellTilt );
	if ( rockCellTiltLen > 0.85 ) {
		rockCellTilt *= 0.85 / rockCellTiltLen;
	}
	normal = normalize( normal - rockCellTilt );
}
`,
    key: () => '',
  },

  // gildvein — connected gold-bearing bands inside dark stone.
  vein: {
    toneSquash: 0.6,
    pars: (s, L) => /* glsl */`

// --- vein: connected gold bands inside stone ---
// ROCK_VEIN is channel-mean balanced (see balancedColorLit), so vein
// coverage cannot shift the albedo mean; the veins read as gold through
// their MATERIAL response (metalness ~1, roughness ~0.25), not brightness.
const vec3 ROCK_VEIN = ${L.vein};
const float ROCK_VEIN_WIDTH = ${glslFloat(s.veinWidth)};
const vec3 ROCK_VEIN_OFF = vec3( 17.3, 43.1, 5.9 );
const vec3 ROCK_VEIN_WARP_OFF = vec3( 41.3, 9.7, 63.1 );
`,
    color: () => /* glsl */`
// The vein mask is a LEVEL SET of a domain-warped low-frequency field:
// |field - 0.5| < width selects the median contour band, which runs as
// long connected curves across the body instead of scattering as isolated
// dots. Tuned offline: ~14% coverage, mean great-circle run length ~14x
// the sample spacing. Mean-neutral per channel average, so the factor
// bypasses rockApplyAlbedo's clamp: the gold saturation IS the feature.
float rockVeinWarp = rockFbm2( rockP * 0.20 + ROCK_VEIN_WARP_OFF );
vec3 rockVeinP = rockP * 0.26 + ROCK_VEIN_OFF + vec3( 0.27, -0.33, 0.41 ) * ( ( rockVeinWarp - 0.5 ) * 0.7 );
float rockVeinDist = abs( rockFbm2( rockVeinP ) - 0.5 );
float rockVein = 1.0 - smoothstep( ROCK_VEIN_WIDTH * 0.17, ROCK_VEIN_WIDTH * 0.31, rockVeinDist );
vec3 rockVeinFactor = mix( vec3( 1.0 ), ROCK_VEIN, rockVein );
rockMult *= rockVeinFactor;
diffuseColor.rgb *= rockVeinFactor;
`,
    roughness: () => /* glsl */`
// Polished metal veins run smooth (~0.25) against the rough stone.
roughnessFactor = mix( roughnessFactor, 0.25, rockVein );
`,
    metalness: () => /* glsl */`
// Veins are metal; the stone between them keeps the material's response.
metalnessFactor = mix( metalnessFactor, 1.0, rockVein );
`,
    key: (s) => `|vein:${s.veinColor}:${s.veinWidth}`,
  },

  // emberglass — thin glowing crack lines on nearly black glass.
  ember: {
    toneSquash: 0.3,
    cavCap: 0.05,
    pars: (s, L) => /* glsl */`

// --- ember: glowing crack network ---
// ROCK_CRACK is an emissive colour (light, not albedo), so it is baked
// unnormalised. The crack field uses its own warp direction so the fissures
// are decorrelated from the base albedo's crevice lines.
const vec3 ROCK_CRACK = ${L.crack};
const float ROCK_CRACK_WIDTH = ${glslFloat(s.crackWidth)};
const float ROCK_CRACK_GLOW = ${glslFloat(s.crackGlow)};
const vec3 ROCK_CRACK_OFF = vec3( 51.7, 3.1, 29.3 );
`,
    color: () => /* glsl */`
// Crack mask: the median level-set band of a warped mid-frequency field,
// narrowed to a bright core of width ~ROCK_CRACK_WIDTH (measured coverage
// ~7%). rockCrack is the glowing core (consumed at the emissive anchor
// below); rockHalo darkens the glass immediately around each fissure so
// the glow reads as light escaping from a crack. The glass between cracks
// stays dark and unbroken.
vec3 rockCrackP = rockP * 0.9 + ROCK_CRACK_OFF + vec3( -0.41, 0.33, -0.27 ) * ( ( rockLow - 0.5 ) * 1.4 );
float rockCrackDist = abs( rockFbm3( rockCrackP ) - 0.5 );
float rockCrack = 1.0 - smoothstep( ROCK_CRACK_WIDTH * 0.07, ROCK_CRACK_WIDTH * 0.18, rockCrackDist );
float rockHalo = ( 1.0 - smoothstep( ROCK_CRACK_WIDTH * 0.18, ROCK_CRACK_WIDTH * 0.6, rockCrackDist ) ) * ( 1.0 - rockCrack );
rockApplyAlbedo( rockMult, diffuseColor.rgb, vec3( 1.0 - rockHalo * 0.06 ) );
`,
    roughness: () => /* glsl */`
// Unbroken glass stays dark, smooth and low-roughness; crack edges are
// physically rough.
roughnessFactor = clamp( mix( roughnessFactor * 0.35, 0.85, rockCrack ), 0.08, 1.0 );
`,
    late: () => /* glsl */`
// Fissure glow: emissive crackColor * crackGlow ONLY inside the crack
// cores — thin bright lines on black glass, not an all-over amber wash.
totalEmissiveRadiance += ROCK_CRACK * ( rockCrack * ROCK_CRACK_GLOW );
`,
    key: (s) => `|crack:${s.crackColor}:${s.crackWidth}:${s.crackGlow}`,
  },

  // livingRock — soft organic growth with faint growth seams, translucent
  // at the rim.
  bloom: {
    toneSquash: 0.8,
    cavCap: 0.08,
    pars: (s, L) => /* glsl */`

// --- bloom: organic mottle + growth seams ---
const vec3 ROCK_MOTTLE_OFF = vec3( 71.3, 13.1, 47.9 );
const vec3 ROCK_SEAM_OFF = vec3( 33.7, 11.1, 57.3 );
`,
    color: () => /* glsl */`
// Soft organic mottle at 0.6x base frequency: broad grown lobes swaying
// gently around the mean — no hard ridges, no crevices.
float rockMottle = rockFbm2( rockP * 0.6 + ROCK_MOTTLE_OFF );
rockApplyAlbedo( rockMult, diffuseColor.rgb, vec3( 1.0 + ( rockMottle - 0.5 ) * 0.12 ) );
// Growth seams: a faint darker net (level-set band of a warped
// low-frequency field, ~10% coverage) so the surface has structure instead
// of reading as a uniform pale egg.
vec3 rockSeamP = rockP * 0.7 + ROCK_SEAM_OFF + vec3( 0.22, 0.31, -0.26 ) * ( ( rockLow - 0.5 ) * 1.0 );
float rockSeam = 1.0 - smoothstep( 0.010, 0.028, abs( rockFbm2( rockSeamP ) - 0.5 ) );
rockApplyAlbedo( rockMult, diffuseColor.rgb, vec3( 1.0 - rockSeam * 0.06 ) );
`,
    late: () => /* glsl */`
// Rim-ward brightening: dot(normal, viewDir) falls toward the silhouette,
// so a pow-2 rim lifts the edges faintly — translucent growth, not stone.
// Centred on the rim's spherical mean (1/3) so the albedo mean stays 1.0.
float rockRim = pow( 1.0 - abs( dot( normal, normalize( vViewPosition ) ) ), 2.0 );
rockApplyAlbedo( rockMult, diffuseColor.rgb, vec3( 1.0 + ( rockRim - 0.3333 ) * 0.18 ) );
`,
    key: () => '',
  },

  // wakeglass — deep violet glass with narrow luminous filaments.
  wake: {
    toneSquash: 0.7,
    pars: (s, L) => /* glsl */`

// --- wake: luminous filaments in glass ---
// ROCK_GLOW is an emissive colour (light, not albedo), baked unnormalised.
const vec3 ROCK_GLOW = ${L.glow};
const float ROCK_GLOW_WIDTH = ${glslFloat(s.glowWidth)};
const vec3 ROCK_FIL_OFF = vec3( 3.7, 59.1, 23.3 );
`,
    roughness: () => /* glsl */`
// Deep glassy body: pull the shared roughness floor down so the unlit glass
// stays glossy; the filaments' glow carries the detail instead.
roughnessFactor = clamp( roughnessFactor * 0.5, 0.07, 1.0 );
`,
    late: () => /* glsl */`
// Narrow luminous filaments: the median level-set band of a domain-warped
// low-frequency field, width ~ROCK_GLOW_WIDTH, measured coverage ~10% —
// thin bright lines over dark violet glass, not an all-over glow. The
// fresnel-ish edge lift keeps the dark body readable at the silhouette; it
// is centred on its spherical mean (1/4) so the albedo mean stays 1.0.
vec3 rockFilP = rockP * 0.55 + ROCK_FIL_OFF + vec3( 0.38, -0.24, 0.30 ) * ( ( rockLow - 0.5 ) * 1.5 );
float rockFilDist = abs( rockFbm2( rockFilP ) - 0.5 );
float rockFil = 1.0 - smoothstep( ROCK_GLOW_WIDTH * 0.10, ROCK_GLOW_WIDTH * 0.17, rockFilDist );
totalEmissiveRadiance += ROCK_GLOW * ( rockFil * 0.9 );
float rockFres = pow( 1.0 - abs( dot( normal, normalize( vViewPosition ) ) ), 3.0 );
rockApplyAlbedo( rockMult, diffuseColor.rgb, vec3( 1.0 + ( rockFres - 0.25 ) * 0.15 ) );
totalEmissiveRadiance += ROCK_GLOW * rockFres * 0.15;
`,
    key: (s) => `|glow:${s.glowColor}:${s.glowWidth}`,
  },
};

/**
 * Patches `material` in place with the profile's surface recipe and returns
 * it. No-op (returns the untouched material) when profile.surface is falsy.
 * @param {THREE.MeshStandardMaterial} material
 * @param {object} profile ORE_TYPES[oreKey].rock
 * @returns {THREE.MeshStandardMaterial}
 */
export function applyRockSurface(material, profile) {
  if (!profile || !profile.surface) return material;
  const s = profile.surface;
  const styleName = s.style || 'regolith';
  const style = SURFACE_STYLES[styleName];
  if (!style) {
    throw new Error(`rock-surface: unknown surface style: ${styleName}`);
  }

  // darkColor/lightColor arrive as sRGB hex; THREE.Color converts to the
  // linear working space the shader math runs in. Each is then divided by
  // the per-channel recipe mean, so mix(ROCK_DARK, ROCK_LIGHT, ~0.5) ≈ 1.0:
  // the pattern modulates AROUND the per-instance colour (heat glow and
  // depletion drive it via setColorAt) instead of replacing it, and the
  // ore tint stays readable at full contrast.
  const dark = new THREE.Color(s.darkColor);
  const light = new THREE.Color(s.lightColor);
  const mean = [(dark.r + light.r) / 2, (dark.g + light.g) / 2, (dark.b + light.b) / 2];
  const darkLit = `vec3( ${glslFloat(dark.r / mean[0])}, ${glslFloat(dark.g / mean[1])}, ${glslFloat(dark.b / mean[2])} )`;
  const lightLit = `vec3( ${glslFloat(light.r / mean[0])}, ${glslFloat(light.g / mean[1])}, ${glslFloat(light.b / mean[2])} )`;

  // Style-specific colour literals, baked only when the recipe carries the
  // key. L.deep reuses the recipe-mean-normalised dark colour (ice).
  const L = { deep: darkLit };
  if (s.rustColor != null) L.rust = balancedColorLit(s.rustColor);
  if (s.veinColor != null) L.vein = balancedColorLit(s.veinColor);
  if (s.crackColor != null) L.crack = emissiveColorLit(s.crackColor);
  if (s.glowColor != null) L.glow = emissiveColorLit(s.glowColor);

  const vertexPars = /* glsl */`
#include <common>

varying vec3 vRockPos;
varying float vRockSeed;
// Object->view normal transform for this instance, so the bump gradient
// tumbles with the rock exactly like the albedo pattern does.
varying mat3 vRockNrmMat;
`;

  const vertexMain = /* glsl */`
#include <begin_vertex>

vRockPos = position;
#ifdef USE_INSTANCING
	// Per-instance seed from the instance translation.
	vRockSeed = fract( sin( dot( instanceMatrix[3].xyz, vec3( 12.9898, 78.233, 37.719 ) ) ) * 43758.5453 );
	vRockNrmMat = normalMatrix * mat3( instanceMatrix );
#else
	vRockSeed = 0.0;
	vRockNrmMat = normalMatrix;
#endif
`;

  // 3D hash value noise (Hoskins hash13, float-only: stable on all GPUs and
  // ES 1.00-safe) plus three fixed-length fBm flavours sharing the same
  // lacunarity 2.1 / gain 0.5 / per-octave offset. Loop bounds are literals
  // because ES 1.00 for-loops need compile-time-constant limits.
  //
  // Per-fragment cost: rockFbm2 x1 + rockFbm5 x1 + rockFbm3 x1 (roughness)
  // + rockFbm3 x6 (bump gradient central differences) = 28 noise calls,
  // bounded by the rocks' screen coverage, not the field size.
  const fragmentPars = /* glsl */`
#include <common>

varying vec3 vRockPos;
varying float vRockSeed;
varying mat3 vRockNrmMat;

const float ROCK_SCALE = ${glslFloat(s.scale)};
const float ROCK_CONTRAST = ${glslFloat(s.contrast)};
const float ROCK_BUMP = ${glslFloat(s.bump)};
const float ROCK_ROUGHVAR = ${glslFloat(s.roughVar)};
const vec3 ROCK_DARK = ${darkLit};
const vec3 ROCK_LIGHT = ${lightLit};

// Grain field: 4x base frequency (finest of its 3 octaves ~160 cells across
// the body) sampled at a far domain offset so it is decorrelated from the
// albedo field even though both share rockHash.
const float ROCK_GRAIN_MULT = 4.0;
const float ROCK_GRAIN_FREQ = ROCK_SCALE * 4.0; // dominant grain frequency, object space
const vec3 ROCK_GRAIN_OFF = vec3( 37.1, 11.9, 53.7 );

// Albedo tone shaper: the ridged signal (1 - abs(2*f - 1)) has a natural
// mean of ~0.81 over this fBm, so re-centre at 0.815 and stretch x2.2 to
// restore a ~0.5 mean with a wide 0..1 spread (tuned offline against a JS
// port of this exact noise stack over 5000 unit-sphere samples).
const float ROCK_WARP = 0.9;
const float ROCK_RIDGE_MID = 0.815;
const float ROCK_RIDGE_GAIN = 2.2;

// Cavity (fake AO): only low-frequency troughs below CAV_MID darken, with
// slope CAV_SLOPE; strength scales with contrast and is capped at 0.35.
const float ROCK_CAV_MID = 0.42;
const float ROCK_CAV_SLOPE = 4.0;
const float ROCK_CAV_STR = 0.8;

// Bump gain derived from the noise frequency: central differences of an
// fBm grow linearly with frequency, and the measured mean |grad| per unit
// frequency of rockFbm3 is 0.0608. ROCK_BUMP is in slope units of 0.22,
// so bump 1.6 targets a mean tangent tilt of ~0.35 (strong, visible
// pitting) at any recipe frequency. ROCK_EPS is a quarter of the dominant
// grain cell — small enough to resolve the grain, large enough for fp32.
const float ROCK_EPS = 0.25 / ROCK_GRAIN_FREQ;
const float ROCK_BUMP_GAIN = ( ROCK_BUMP * 0.22 ) / ( ROCK_GRAIN_FREQ * 0.0608 );

float rockHash( vec3 p3 ) {
	p3 = fract( p3 * 0.1031 );
	p3 += dot( p3, p3.zyx + 31.32 );
	return fract( ( p3.x + p3.y ) * p3.z );
}

float rockNoise( vec3 x ) {
	vec3 i = floor( x );
	vec3 f = fract( x );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix(
		mix( mix( rockHash( i + vec3( 0.0, 0.0, 0.0 ) ), rockHash( i + vec3( 1.0, 0.0, 0.0 ) ), f.x ),
		     mix( rockHash( i + vec3( 0.0, 1.0, 0.0 ) ), rockHash( i + vec3( 1.0, 1.0, 0.0 ) ), f.x ), f.y ),
		mix( mix( rockHash( i + vec3( 0.0, 0.0, 1.0 ) ), rockHash( i + vec3( 1.0, 0.0, 1.0 ) ), f.x ),
		     mix( rockHash( i + vec3( 0.0, 1.0, 1.0 ) ), rockHash( i + vec3( 1.0, 1.0, 1.0 ) ), f.x ), f.y ),
		f.z );
}

// 5-octave base fBm, normalised to ~0..1 (amplitude sum 0.96875).
float rockFbm5( vec3 p ) {
	float v = 0.0;
	float a = 0.5;
	for ( int o = 0; o < 5; o ++ ) {
		v += a * rockNoise( p );
		p = p * 2.1 + vec3( 11.7, 5.3, 7.1 );
		a *= 0.5;
	}
	return v / 0.96875;
}

// 3-octave fBm for the grain field (amplitude sum 0.875).
float rockFbm3( vec3 p ) {
	float v = 0.0;
	float a = 0.5;
	for ( int o = 0; o < 3; o ++ ) {
		v += a * rockNoise( p );
		p = p * 2.1 + vec3( 11.7, 5.3, 7.1 );
		a *= 0.5;
	}
	return v / 0.875;
}

// 2-octave low-frequency fBm for the warp and cavity signals (sum 0.75).
float rockFbm2( vec3 p ) {
	float v = 0.0;
	float a = 0.5;
	for ( int o = 0; o < 2; o ++ ) {
		v += a * rockNoise( p );
		p = p * 2.1 + vec3( 11.7, 5.3, 7.1 );
		a *= 0.5;
	}
	return v / 0.75;
}

// The independent high-frequency grain field: 4x base, offset domain.
float rockGrain( vec3 p ) {
	return rockFbm3( p * ROCK_GRAIN_MULT + ROCK_GRAIN_OFF );
}
`;

  const fragmentColorRegolith = /* glsl */`
#include <color_fragment>

// Seeded object-space sample point: one position feeds the low-frequency
// warp/cavity field and the ridged albedo field.
vec3 rockP = vRockPos * ROCK_SCALE + vec3( vRockSeed * 23.7, vRockSeed * 11.3, vRockSeed * 17.9 );
float rockLow = rockFbm2( rockP );
// Domain warp along a fixed skew direction, then ridge-fold: sharp dark
// crevice lines and patchy regolith plateaus instead of a soft cloud.
vec3 rockWarpP = rockP + vec3( 0.35, -0.27, 0.41 ) * ( ( rockLow - 0.5 ) * ROCK_WARP );
float rockRidge = 1.0 - abs( 2.0 * rockFbm5( rockWarpP ) - 1.0 );
float rockTone = clamp( ( rockRidge - ROCK_RIDGE_MID ) * ROCK_RIDGE_GAIN + 0.5, 0.0, 1.0 );
// Multiply around the instance tint already in diffuseColor (vColor from
// setColorAt): contrast blends flat -> full two-tone pattern, mean 1.0.
vec3 rockAlbedo = mix( vec3( 1.0 ), mix( ROCK_DARK, ROCK_LIGHT, rockTone ), ROCK_CONTRAST );
// Cavity darkening: fake AO in the low-frequency troughs (crater bowls,
// crevice floors), contrast-scaled and capped at 0.35.
float rockCavity = clamp( ( ROCK_CAV_MID - rockLow ) * ROCK_CAV_SLOPE, 0.0, 1.0 );
float rockCavDark = 1.0 - min( rockCavity * ROCK_CONTRAST * ROCK_CAV_STR, 0.35 );
// Bounded: never fully black, never blown out.
diffuseColor.rgb *= clamp( rockAlbedo * rockCavDark, vec3( 0.30 ), vec3( 1.55 ) );
`;

  // CALM base (every style except the frozen regolith): same skeleton, but
  // the ridge rides rockFbm5Fine (energy in the fine octaves), warp/gain/
  // cavity are gentler, a per-style tone squash flattens styles whose
  // material must stay near-flat, and the applied multiplier is kept in
  // rockMult so style features re-clamp the running product through
  // rockApplyAlbedo. toneSquash and cavCap are baked per style below.
  const fragmentColorCalm = /* glsl */`
#include <color_fragment>

// Seeded object-space sample point: one position feeds the low-frequency
// warp/cavity field and the ridged albedo field.
vec3 rockP = vRockPos * ROCK_SCALE + vec3( vRockSeed * 23.7, vRockSeed * 11.3, vRockSeed * 17.9 );
float rockLow = rockFbm2( rockP );
// Domain warp along a fixed skew direction, then ridge-fold over the
// fine-weighted fBm: sharp crevice lines at grain scale, not paint blobs.
vec3 rockWarpP = rockP + vec3( 0.35, -0.27, 0.41 ) * ( ( rockLow - 0.5 ) * ROCK_CALM_WARP );
float rockRidge = 1.0 - abs( 2.0 * rockFbm5Fine( rockWarpP ) - 1.0 );
float rockTone = clamp( ( rockRidge - ROCK_CALM_RIDGE_MID ) * ROCK_CALM_RIDGE_GAIN + 0.5, 0.0, 1.0 );
// Tone squash: compress toward the 0.5 mean for styles whose material must
// stay near-flat (ember glass, gildvein stone). Mean-preserving.
rockTone = ( rockTone - 0.5 ) * ROCK_TONE_SQUASH + 0.5;
// Multiply around the instance tint already in diffuseColor (vColor from
// setColorAt): contrast blends flat -> full two-tone pattern, mean 1.0.
vec3 rockAlbedo = mix( vec3( 1.0 ), mix( ROCK_DARK, ROCK_LIGHT, rockTone ), ROCK_CONTRAST );
// Cavity darkening: fake AO in the low-frequency troughs, gentler slope and
// a per-style cap far below the regolith 0.35.
float rockCavity = clamp( ( ROCK_CALM_CAV_MID - rockLow ) * ROCK_CALM_CAV_SLOPE, 0.0, 1.0 );
float rockCavDark = 1.0 - min( rockCavity * ROCK_CONTRAST * ROCK_CALM_CAV_STR, ROCK_CAV_CAP );
// Bounded to [0.74, 1.30] here; style features re-clamp the running
// product to [0.70, 1.34] via rockApplyAlbedo.
vec3 rockMult = clamp( rockAlbedo * rockCavDark, vec3( 0.74 ), vec3( 1.30 ) );
diffuseColor.rgb *= rockMult;
`;

  // Calm-only pars: the fine-weighted fBm, the re-clamping albedo helper,
  // and the calm constants. Regolith never sees these (its program is
  // frozen byte-identical to the pilot).
  const calmPars = /* glsl */`

// --- calm base (all styles except the frozen regolith) ---
// Fine-weighted fBm: octave weights [0.10, 0.14, 0.20, 0.26, 0.30] push
// 76% of the energy into the top three octaves (the pilot's rockFbm5 keeps
// 77% in the bottom two), so the albedo break-up reads as fine rock grain
// instead of low-frequency confetti. The finest octave is intact.
const float ROCK_CALM_WARP = 0.55;
const float ROCK_CALM_RIDGE_MID = 0.860; // measured mean of ridged rockFbm5Fine over the sphere
const float ROCK_CALM_RIDGE_GAIN = 1.6;
const float ROCK_CALM_CAV_MID = 0.40;
const float ROCK_CALM_CAV_SLOPE = 4.0;
const float ROCK_CALM_CAV_STR = 0.5;
const float ROCK_CAV_CAP = ${glslFloat(style.cavCap ?? 0.10)};
const float ROCK_TONE_SQUASH = ${glslFloat(style.toneSquash ?? 1.0)};

float rockFbm5Fine( vec3 p ) {
	float v = 0.10 * rockNoise( p );
	p = p * 2.1 + vec3( 11.7, 5.3, 7.1 );
	v += 0.14 * rockNoise( p );
	p = p * 2.1 + vec3( 11.7, 5.3, 7.1 );
	v += 0.20 * rockNoise( p );
	p = p * 2.1 + vec3( 11.7, 5.3, 7.1 );
	v += 0.26 * rockNoise( p );
	p = p * 2.1 + vec3( 11.7, 5.3, 7.1 );
	v += 0.30 * rockNoise( p );
	return v;
}

// Every style albedo edit multiplies through this helper: the running
// per-channel multiplier is re-clamped to [0.70, 1.34] and diffuseColor is
// rescaled by the ratio, so overlapping features can never stack the
// surface into confetti or mud. (Vein/rust factors are channel-mean
// balanced and bypass this on purpose — their saturation is the feature.)
void rockApplyAlbedo( inout vec3 rockMult, inout vec3 diffuseRgb, vec3 factor ) {
	vec3 rockMultNew = clamp( rockMult * factor, vec3( 0.70 ), vec3( 1.34 ) );
	diffuseRgb *= rockMultNew / rockMult;
	rockMult = rockMultNew;
}
`;

  const isRegolith = styleName === 'regolith';
  const fragmentColor = isRegolith ? fragmentColorRegolith : fragmentColorCalm;

  const fragmentRoughness = /* glsl */`
#include <roughnessmap_fragment>

// +/- roughVar from the independent GRAIN field (micro-relief sparkle,
// decorrelated from the albedo patches), clamped to [0.35, 1.0]: rock is
// never glossy.
float rockG = rockGrain( rockP );
roughnessFactor = clamp( roughnessFactor + ( rockG - 0.5 ) * 2.0 * ROCK_ROUGHVAR, 0.35, 1.0 );
`;

  // Bump from the GRAIN field gradient: central differences (ROCK_EPS a
  // quarter grain cell), transformed object->view with the per-instance
  // normal matrix, projected onto the tangent plane so only the slope
  // tilts the normal. The tilt length is clamped to 0.85 < 1, so
  // dot(perturbed, geometric) = 1/sqrt(1 + tilt^2) stays >= ~0.76: the
  // normal can never flip away from the viewer near the silhouette.
  const fragmentNormal = /* glsl */`
#include <normal_fragment_maps>

{
	vec3 rockGrad = vec3(
		rockGrain( rockP + vec3( ROCK_EPS, 0.0, 0.0 ) ) - rockGrain( rockP - vec3( ROCK_EPS, 0.0, 0.0 ) ),
		rockGrain( rockP + vec3( 0.0, ROCK_EPS, 0.0 ) ) - rockGrain( rockP - vec3( 0.0, ROCK_EPS, 0.0 ) ),
		rockGrain( rockP + vec3( 0.0, 0.0, ROCK_EPS ) ) - rockGrain( rockP - vec3( 0.0, 0.0, ROCK_EPS ) )
	) / ( 2.0 * ROCK_EPS );
	vec3 rockGradView = vRockNrmMat * rockGrad;
	rockGradView -= dot( rockGradView, normal ) * normal;
	vec3 rockTilt = rockGradView * ROCK_BUMP_GAIN;
	float rockTiltLen = length( rockTilt );
	if ( rockTiltLen > 0.85 ) {
		rockTilt *= 0.85 / rockTiltLen;
	}
	normal = normalize( normal - rockTilt );
}
`;

  // Style dispatch: each snippet is concatenated onto its shared injection
  // (empty for regolith, so the approved rawOre program is byte-identical).
  // The metalness and late snippets carry their own anchor lines because
  // those injections only exist for styles that ask for them.
  const parsExtra = style.pars ? style.pars(s, L) : '';
  const colorExtra = style.color ? style.color(s, L) : '';
  const roughnessExtra = style.roughness ? style.roughness(s, L) : '';
  const normalExtra = style.normal ? style.normal(s, L) : '';
  const metalnessBlock = style.metalness
    ? `#include <metalnessmap_fragment>\n${style.metalness(s, L)}`
    : '';
  const lateBlock = style.late
    ? `#include <emissivemap_fragment>\n${style.late(s, L)}`
    : '';

  material.onBeforeCompile = (shader) => {
    shader.vertexShader = inject(shader.vertexShader, '#include <common>', vertexPars);
    shader.vertexShader = inject(shader.vertexShader, '#include <begin_vertex>', vertexMain);
    shader.fragmentShader = inject(shader.fragmentShader, '#include <common>', fragmentPars + (isRegolith ? '' : calmPars) + parsExtra);
    shader.fragmentShader = inject(shader.fragmentShader, '#include <color_fragment>', fragmentColor + colorExtra);
    shader.fragmentShader = inject(shader.fragmentShader, '#include <roughnessmap_fragment>', fragmentRoughness + roughnessExtra);
    if (metalnessBlock) {
      shader.fragmentShader = inject(shader.fragmentShader, '#include <metalnessmap_fragment>', metalnessBlock);
    }
    shader.fragmentShader = inject(shader.fragmentShader, '#include <normal_fragment_maps>', fragmentNormal + normalExtra);
    if (lateBlock) {
      shader.fragmentShader = inject(shader.fragmentShader, '#include <emissivemap_fragment>', lateBlock);
    }
  };

  // Program cache identity: style name + the full recipe + every
  // style-specific literal, so one compiled program is never shared across
  // differently-parameterised rock materials.
  const cacheKey = `rock-surface|${styleName}|${s.scale}|${s.contrast}|${s.bump}|${s.roughVar}|${s.darkColor}|${s.lightColor}${style.key ? style.key(s) : ''}`;
  material.customProgramCacheKey = () => cacheKey;

  return material;
}
