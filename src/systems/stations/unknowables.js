/**
 * The Quiet — Unknowables origin dock (Wave 94).
 *
 * Dedicated path, not DETAIL_STATIONS (D3) and not a Beautiful flower copy.
 * Hush / void / lens language matches the Unknowables gate overlay: a dark
 * core, nested additive lenses, ultraviolet and electric cyan. station.js
 * wraps the kit with stationRecord (beacon, halo, teardown). No shared
 * materials — teardownMesh disposes every map and material on the group.
 */

import * as THREE from 'three';

export const UNKNOWABLES_STATION_PATH = true;

export function assembleUnknowablesStation(def, scheme) {
  const group = new THREE.Group();
  group.name = 'unknowables-station';
  const pos = def?.station?.position;
  if (Array.isArray(pos) && pos.length >= 3) group.position.fromArray(pos);

  const voidMat = new THREE.MeshStandardMaterial({
    color: scheme.dark,
    metalness: 0.08,
    roughness: 0.85,
    emissive: scheme.darkEmissive,
  });
  const lightMat = new THREE.MeshBasicMaterial({
    color: scheme.light,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beaconMat = new THREE.MeshBasicMaterial({ color: scheme.beacon });
  const lensUv = new THREE.MeshBasicMaterial({
    color: scheme.patch?.[0] ?? 0x665fac,
    transparent: true,
    opacity: 0.44,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const lensCyan = new THREE.MeshBasicMaterial({
    color: scheme.accent,
    transparent: true,
    opacity: 0.4,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: scheme.accent,
    transparent: true,
    opacity: 0.26,
    roughness: 0.38,
    metalness: 0,
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
    depthWrite: false,
  });

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(5.2, 1), voidMat);
  group.add(core);
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(7.0, 1), glassMat);
  group.add(shell);

  const moteGeo = new THREE.SphereGeometry(0.5, 8, 6);
  for (let i = 0; i < 7; i++) {
    const mote = new THREE.Mesh(moteGeo, lightMat);
    mote.position.set(0, -16 + i * 5, 0);
    group.add(mote);
  }

  const ringGroup = new THREE.Group();
  ringGroup.position.y = 2;
  const torusA = new THREE.Mesh(new THREE.TorusGeometry(18, 0.28, 8, 48), lensUv);
  torusA.rotation.x = Math.PI / 2;
  ringGroup.add(torusA);
  const torusB = new THREE.Mesh(new THREE.TorusGeometry(22, 0.22, 8, 48), lensCyan);
  torusB.rotation.x = Math.PI / 2.35;
  torusB.rotation.z = 0.38;
  ringGroup.add(torusB);
  const torusC = new THREE.Mesh(new THREE.TorusGeometry(13.5, 0.18, 8, 40), lensUv);
  torusC.rotation.x = Math.PI / 1.75;
  torusC.rotation.y = 0.32;
  ringGroup.add(torusC);

  const discGeo = new THREE.CircleGeometry(6.2, 28);
  for (let i = 0; i < 4; i++) {
    const ang = (i / 4) * Math.PI * 2;
    const disc = new THREE.Mesh(discGeo, i % 2 === 0 ? lensCyan : lensUv);
    disc.position.set(Math.cos(ang) * 15.5, i % 2 === 0 ? 3.5 : -2.5, Math.sin(ang) * 15.5);
    disc.lookAt(0, 0, 0);
    ringGroup.add(disc);
  }
  group.add(ringGroup);

  return { group, ringGroup, lightMat, beaconMat };
}
