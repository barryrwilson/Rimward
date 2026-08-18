/**
 * Mount a faction gate sculpt onto a group. Shared materials + dispose lists.
 */
import * as THREE from 'three';
import { detailBuilder } from '../gate-detail.js';

export function mountGateSculpt(group, spec, st, seed) {
  const b = detailBuilder();
  const shutterB = detailBuilder();
  spec.build(b, shutterB, st, seed);
  const geos = b.build();
  const shutterGeos = shutterB.build();
  if (!geos.hull) throw new Error(`${spec.id || 'gate'} sculpt emitted no hull chunk`);

  const hullMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    metalness: st.metalness,
    roughness: st.roughness,
    emissive: st.glow,
    emissiveIntensity: 0.12,
  });
  const lightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });
  const glazeMat = new THREE.MeshBasicMaterial({ color: 0xffffff, vertexColors: true });

  const disposeMats = [hullMat, lightMat, glazeMat];
  const disposeGeos = [];

  const addChunk = (parent, geo, mat) => {
    if (!geo) return null;
    disposeGeos.push(geo);
    const mesh = new THREE.Mesh(geo, mat);
    parent.add(mesh);
    return mesh;
  };

  const hull = addChunk(group, geos.hull, hullMat);
  addChunk(group, geos.glow, lightMat);
  addChunk(group, geos.glaze, glazeMat);

  const shutter = new THREE.Group();
  addChunk(shutter, shutterGeos.hull, hullMat);
  addChunk(shutter, shutterGeos.glow, lightMat);
  if (shutter.children.length) group.add(shutter);

  return { hull, hullMat, lightMat, glazeMat, shutter, disposeMats, disposeGeos };
}
