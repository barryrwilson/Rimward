import * as THREE from 'three';

// Review-only sculpting helpers. Nothing in the game imports this directory.
export function materials(accent = '#82e8d6') {
  const hue = new THREE.Color(accent);
  const tissue = {
    side: THREE.DoubleSide,
    metalness: 0.06,
    roughness: 0.46,
    clearcoat: 0.3,
    clearcoatRoughness: 0.38,
    iridescence: 0.38,
    iridescenceIOR: 1.3,
    iridescenceThicknessRange: [160, 360],
  };
  return {
    skin: new THREE.MeshPhysicalMaterial({
      ...tissue, color: hue.clone().multiplyScalar(0.55),
    }),
    underside: new THREE.MeshPhysicalMaterial({
      ...tissue, color: '#b5cac7', roughness: 0.49,
    }),
    membrane: new THREE.MeshPhysicalMaterial({
      ...tissue, color: hue.clone().lerp(new THREE.Color('#c5b8de'), 0.4),
      transparent: false, opacity: 1, depthWrite: true,
      transmission: 0.16, thickness: 0.18, roughness: 0.48,
    }),
    ridge: new THREE.MeshPhysicalMaterial({
      ...tissue, color: hue.clone().lerp(new THREE.Color('#d7e7df'), 0.48),
    }),
    glow: new THREE.MeshPhysicalMaterial({
      ...tissue, color: hue, emissive: hue, emissiveIntensity: 1.1,
    }),
    warm: new THREE.MeshPhysicalMaterial({
      ...tissue, color: '#edbb92', emissive: '#ff9969', emissiveIntensity: 0.6,
    }),
    dark: new THREE.MeshPhysicalMaterial({
      ...tissue, color: '#172c3a', roughness: 0.5, iridescence: 0.25,
    }),
  };
}

export function surface(group, fn, material, uSegments = 64, vSegments = 32) {
  const stride = vSegments + 1;
  const count = (uSegments + 1) * stride;
  const positions = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices = new Uint32Array(uSegments * vSegments * 6);
  let vertex = 0;
  for (let i = 0; i <= uSegments; i++) {
    for (let j = 0; j <= vSegments; j++) {
      const u = i / uSegments;
      const v = j / vSegments;
      const point = fn(u, v);
      positions[vertex * 3] = point[0];
      positions[vertex * 3 + 1] = point[1];
      positions[vertex * 3 + 2] = point[2];
      uvs[vertex * 2] = u;
      uvs[vertex * 2 + 1] = v;
      vertex++;
    }
  }
  let index = 0;
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const a = i * stride + j;
      const b = a + stride;
      indices[index++] = a;
      indices[index++] = b;
      indices[index++] = a + 1;
      indices[index++] = b;
      indices[index++] = b + 1;
      indices[index++] = a + 1;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}

export function ellipsoid(group, center, scale, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 24), material);
  mesh.position.fromArray(center);
  mesh.scale.fromArray(scale);
  group.add(mesh);
  return mesh;
}

export function tendril(group, points, radius, material, options = {}) {
  const { tip = 0.003, segments = 64, sides = 10 } = options;
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const frames = curve.computeFrenetFrames(segments, false);
  const stride = sides + 1;
  const ringVertices = (segments + 1) * stride;
  const positions = new Float32Array((ringVertices + 2) * 3);
  const indices = [];
  const point = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const r = tip + (radius - tip) * Math.pow(1 - t, 1.15);
    curve.getPointAt(t, point);
    for (let j = 0; j <= sides; j++) {
      const angle = j / sides * Math.PI * 2;
      const a = Math.cos(angle) * r;
      const b = Math.sin(angle) * r;
      const offset = (i * stride + j) * 3;
      positions[offset] = point.x + a * frames.normals[i].x + b * frames.binormals[i].x;
      positions[offset + 1] = point.y + a * frames.normals[i].y + b * frames.binormals[i].y;
      positions[offset + 2] = point.z + a * frames.normals[i].z + b * frames.binormals[i].z;
      if (i < segments && j < sides) {
        const n = i * stride + j;
        indices.push(n, n + 1, n + stride, n + 1, n + stride + 1, n + stride);
      }
    }
  }
  curve.getPointAt(0, point).toArray(positions, ringVertices * 3);
  curve.getPointAt(1, point).toArray(positions, (ringVertices + 1) * 3);
  for (let j = 0; j < sides; j++) {
    indices.push(ringVertices, j + 1, j);
    const n = segments * stride + j;
    indices.push(ringVertices + 1, n, n + 1);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
  return mesh;
}
