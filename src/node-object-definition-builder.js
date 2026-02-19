import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

export function isDescriptor(entry) {
  return (
    entry != null &&
    typeof entry === 'object' &&
    !Array.isArray(entry) &&
    typeof entry.geometry === 'object' &&
    entry.geometry !== null &&
    typeof entry.geometry.type === 'string'
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const VALID_GEOMETRY_TYPES = new Set([
  'sphere', 'box', 'cylinder', 'cone', 'torus',
  'plane', 'ring',
  'dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron'
]);

const VALID_MATERIAL_TYPES = new Set([
  'standard', 'lambert', 'phong', 'basic', 'shader'
]);

export function validateDescriptor(descriptor, typeName) {
  if (!descriptor.geometry || !VALID_GEOMETRY_TYPES.has(descriptor.geometry.type)) {
    console.warn(`nodeObjectTypes["${typeName}"]: unknown geometry type "${descriptor.geometry?.type}". Ignoring.`);
    return null;
  }

  if (!descriptor.material || !VALID_MATERIAL_TYPES.has(descriptor.material.type)) {
    console.warn(`nodeObjectTypes["${typeName}"]: unknown material type "${descriptor.material?.type}". Ignoring.`);
    return null;
  }

  if (descriptor.animations && descriptor.animations.length > 0 && descriptor.material.type !== 'shader') {
    console.warn(`nodeObjectTypes["${typeName}"]: animations require material type "shader". Animations will be ignored.`);
    return { ...descriptor, animations: undefined };
  }

  return descriptor;
}

// ---------------------------------------------------------------------------
// Geometry builder
// ---------------------------------------------------------------------------

export function buildGeometry(geoDesc) {
  const p = geoDesc.params || {};

  switch (geoDesc.type) {
    case 'sphere':
      return new THREE.SphereGeometry(p.radius ?? 1, p.widthSegments ?? 16, p.heightSegments ?? 12);
    case 'box':
      return new THREE.BoxGeometry(p.width ?? 1, p.height ?? 1, p.depth ?? 1);
    case 'cylinder':
      return new THREE.CylinderGeometry(p.radiusTop ?? 1, p.radiusBottom ?? 1, p.height ?? 1, p.radialSegments ?? 16);
    case 'cone':
      return new THREE.ConeGeometry(p.radius ?? 1, p.height ?? 1, p.radialSegments ?? 16);
    case 'torus':
      return new THREE.TorusGeometry(p.radius ?? 1, p.tube ?? 0.4, p.radialSegments ?? 12, p.tubularSegments ?? 48);
    case 'plane':
      return new THREE.PlaneGeometry(p.width ?? 1, p.height ?? 1);
    case 'ring':
      return new THREE.RingGeometry(p.innerRadius ?? 0.5, p.outerRadius ?? 1);
    case 'dodecahedron':
      return new THREE.DodecahedronGeometry(p.radius ?? 1, p.detail ?? 0);
    case 'icosahedron':
      return new THREE.IcosahedronGeometry(p.radius ?? 1, p.detail ?? 0);
    case 'octahedron':
      return new THREE.OctahedronGeometry(p.radius ?? 1, p.detail ?? 0);
    case 'tetrahedron':
      return new THREE.TetrahedronGeometry(p.radius ?? 1, p.detail ?? 0);
    default:
      return new THREE.SphereGeometry(1, 16, 12);
  }
}

// ---------------------------------------------------------------------------
// Uniform conversion
// ---------------------------------------------------------------------------

export function resolveUniformValue(desc) {
  switch (desc.type) {
    case 'float':
    case 'int':
      return { value: typeof desc.value === 'number' ? desc.value : 0 };
    case 'vec2':
      return { value: Array.isArray(desc.value) ? new THREE.Vector2(desc.value[0], desc.value[1]) : new THREE.Vector2() };
    case 'vec3':
      return { value: Array.isArray(desc.value) ? new THREE.Vector3(desc.value[0], desc.value[1], desc.value[2]) : new THREE.Vector3() };
    case 'vec4':
      return { value: Array.isArray(desc.value) ? new THREE.Vector4(desc.value[0], desc.value[1], desc.value[2], desc.value[3]) : new THREE.Vector4() };
    case 'color':
      return { value: new THREE.Color(desc.value) };
    default:
      return { value: desc.value };
  }
}

// ---------------------------------------------------------------------------
// Material builder
// ---------------------------------------------------------------------------

const SIDE_MAP = {
  front: THREE.FrontSide,
  back: THREE.BackSide,
  double: THREE.DoubleSide
};

export function buildMaterial(matDesc, hasAnimations) {
  if (matDesc.type === 'shader') {
    const uniforms = {};

    if (matDesc.uniforms) {
      for (const [name, desc] of Object.entries(matDesc.uniforms)) {
        uniforms[name] = resolveUniformValue(desc);
      }
    }

    if (hasAnimations) {
      if (!uniforms.u_time) {
        uniforms.u_time = { value: 0.0 };
      }
    }

    return new THREE.ShaderMaterial({
      vertexShader: matDesc.vertexShader,
      fragmentShader: matDesc.fragmentShader,
      uniforms,
      transparent: matDesc.transparent || false,
      wireframe: matDesc.wireframe || false,
      side: SIDE_MAP[matDesc.side] ?? THREE.FrontSide
    });
  }

  const params = {};
  if (matDesc.color != null) params.color = new THREE.Color(matDesc.color);
  if (matDesc.opacity != null) params.opacity = matDesc.opacity;
  if (matDesc.transparent != null) params.transparent = matDesc.transparent;
  if (matDesc.wireframe != null) params.wireframe = matDesc.wireframe;
  if (matDesc.emissive != null) params.emissive = new THREE.Color(matDesc.emissive);
  if (matDesc.emissiveIntensity != null) params.emissiveIntensity = matDesc.emissiveIntensity;

  switch (matDesc.type) {
    case 'standard':
      if (matDesc.metalness != null) params.metalness = matDesc.metalness;
      if (matDesc.roughness != null) params.roughness = matDesc.roughness;
      return new THREE.MeshStandardMaterial(params);
    case 'phong':
      if (matDesc.shininess != null) params.shininess = matDesc.shininess;
      return new THREE.MeshPhongMaterial(params);
    case 'lambert':
      return new THREE.MeshLambertMaterial(params);
    case 'basic':
      return new THREE.MeshBasicMaterial(params);
    default:
      return new THREE.MeshBasicMaterial(params);
  }
}

// ---------------------------------------------------------------------------
// Mesh builder
// ---------------------------------------------------------------------------

export function buildMesh(descriptor) {
  const hasAnimations = !!(descriptor.animations && descriptor.animations.length > 0);
  const geometry = buildGeometry(descriptor.geometry);
  const material = buildMaterial(descriptor.material, hasAnimations);
  const mesh = new THREE.Mesh(geometry, material);

  if (descriptor.scale != null) {
    if (Array.isArray(descriptor.scale)) {
      mesh.scale.set(descriptor.scale[0], descriptor.scale[1], descriptor.scale[2]);
    } else {
      mesh.scale.set(descriptor.scale, descriptor.scale, descriptor.scale);
    }
  }

  return mesh;
}

// ---------------------------------------------------------------------------
// Type cache — shares geometry, shares material for non-animated types
// ---------------------------------------------------------------------------

export class DeclarativeTypeCache {
  constructor() {
    this._geometries = new Map();  // typeName -> BufferGeometry
    this._materials = new Map();   // typeName -> Material
    this._descriptors = new Map(); // typeName -> descriptor
  }

  get(typeName, descriptor) {
    // Cache geometry per type
    if (!this._geometries.has(typeName)) {
      this._geometries.set(typeName, buildGeometry(descriptor.geometry));
    }

    const hasAnimations = !!(descriptor.animations && descriptor.animations.length > 0);

    // Cache material per type (all same-type nodes share material, animate in lockstep)
    if (!this._materials.has(typeName)) {
      this._materials.set(typeName, buildMaterial(descriptor.material, hasAnimations));
    }

    this._descriptors.set(typeName, descriptor);

    const geometry = this._geometries.get(typeName);
    const material = this._materials.get(typeName);
    const mesh = new THREE.Mesh(geometry, material);

    if (descriptor.scale != null) {
      if (Array.isArray(descriptor.scale)) {
        mesh.scale.set(descriptor.scale[0], descriptor.scale[1], descriptor.scale[2]);
      } else {
        mesh.scale.set(descriptor.scale, descriptor.scale, descriptor.scale);
      }
    }

    return mesh;
  }

  getMaterial(typeName) {
    return this._materials.get(typeName);
  }

  dispose() {
    for (const geo of this._geometries.values()) {
      if (geo.dispose) geo.dispose();
    }
    for (const mat of this._materials.values()) {
      if (mat.dispose) mat.dispose();
    }
    this._geometries.clear();
    this._materials.clear();
    this._descriptors.clear();
  }
}
