// Lightweight Three.js mock for unit testing declarative node builder/animator.
// Records constructor args and provides dispose() stubs.

function makeMockClass(name) {
  return class {
    constructor(...args) {
      this._className = name;
      this._args = args;
      this.dispose = () => { this._disposed = true; };
    }
  };
}

// Geometries
export const SphereGeometry = makeMockClass('SphereGeometry');
export const BoxGeometry = makeMockClass('BoxGeometry');
export const CylinderGeometry = makeMockClass('CylinderGeometry');
export const ConeGeometry = makeMockClass('ConeGeometry');
export const TorusGeometry = makeMockClass('TorusGeometry');
export const PlaneGeometry = makeMockClass('PlaneGeometry');
export const RingGeometry = makeMockClass('RingGeometry');
export const DodecahedronGeometry = makeMockClass('DodecahedronGeometry');
export const IcosahedronGeometry = makeMockClass('IcosahedronGeometry');
export const OctahedronGeometry = makeMockClass('OctahedronGeometry');
export const TetrahedronGeometry = makeMockClass('TetrahedronGeometry');

// Materials
export class MeshBasicMaterial {
  constructor(params = {}) {
    this._className = 'MeshBasicMaterial';
    this._params = params;
    Object.assign(this, params);
    this.dispose = () => { this._disposed = true; };
  }
}

export class MeshLambertMaterial {
  constructor(params = {}) {
    this._className = 'MeshLambertMaterial';
    this._params = params;
    Object.assign(this, params);
    this.dispose = () => { this._disposed = true; };
  }
}

export class MeshPhongMaterial {
  constructor(params = {}) {
    this._className = 'MeshPhongMaterial';
    this._params = params;
    Object.assign(this, params);
    this.dispose = () => { this._disposed = true; };
  }
}

export class MeshStandardMaterial {
  constructor(params = {}) {
    this._className = 'MeshStandardMaterial';
    this._params = params;
    Object.assign(this, params);
    this.dispose = () => { this._disposed = true; };
  }
}

export class ShaderMaterial {
  constructor(params = {}) {
    this._className = 'ShaderMaterial';
    this._params = params;
    this.uniforms = params.uniforms || {};
    this.vertexShader = params.vertexShader || '';
    this.fragmentShader = params.fragmentShader || '';
    this.transparent = params.transparent || false;
    this.wireframe = params.wireframe || false;
    this.side = params.side != null ? params.side : 0; // FrontSide
    this.uniformsNeedUpdate = false;
    this.dispose = () => { this._disposed = true; };
  }
  clone() {
    const cloned = new ShaderMaterial(this._params);
    cloned.uniforms = {};
    for (const [k, v] of Object.entries(this.uniforms)) {
      cloned.uniforms[k] = { value: v.value };
    }
    return cloned;
  }
}

// Mesh
export class Mesh {
  constructor(geometry, material) {
    this._className = 'Mesh';
    this.geometry = geometry;
    this.material = material;
    this.scale = { x: 1, y: 1, z: 1, set(x, y, z) { this.x = x; this.y = y; this.z = z; } };
  }
}

// Math types
export class Vector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; this._className = 'Vector2'; }
}

export class Vector3 {
  constructor(x = 0, y = 0, z = 0) { this.x = x; this.y = y; this.z = z; this._className = 'Vector3'; }
}

export class Vector4 {
  constructor(x = 0, y = 0, z = 0, w = 0) { this.x = x; this.y = y; this.z = z; this.w = w; this._className = 'Vector4'; }
}

export class Color {
  constructor(color) { this._color = color; this._className = 'Color'; }
}

// Side constants
export const FrontSide = 0;
export const BackSide = 1;
export const DoubleSide = 2;
