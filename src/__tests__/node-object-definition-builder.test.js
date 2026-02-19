import {
  isDescriptor,
  validateDescriptor,
  buildGeometry,
  buildMaterial,
  buildMesh,
  resolveUniformValue,
  DeclarativeTypeCache
} from '../node-object-definition-builder.js';

// ---------------------------------------------------------------------------
// isDescriptor
// ---------------------------------------------------------------------------

describe('isDescriptor', () => {
  test('returns true for a valid descriptor object', () => {
    expect(isDescriptor({ geometry: { type: 'sphere' }, material: { type: 'basic' } })).toBe(true);
  });

  test('returns false for a function', () => {
    expect(isDescriptor(() => ({}))).toBe(false);
  });

  test('returns false for null / undefined / primitives', () => {
    expect(isDescriptor(null)).toBe(false);
    expect(isDescriptor(undefined)).toBe(false);
    expect(isDescriptor(42)).toBe(false);
    expect(isDescriptor('string')).toBe(false);
  });

  test('returns false for an array', () => {
    expect(isDescriptor([1, 2])).toBe(false);
  });

  test('returns false for an object without geometry.type', () => {
    expect(isDescriptor({ material: { type: 'basic' } })).toBe(false);
    expect(isDescriptor({ geometry: {} })).toBe(false);
    expect(isDescriptor({ geometry: null })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateDescriptor
// ---------------------------------------------------------------------------

describe('validateDescriptor', () => {
  const originalWarn = console.warn;
  let warnings;

  beforeEach(() => { warnings = []; console.warn = (msg) => warnings.push(msg); });
  afterEach(() => { console.warn = originalWarn; });

  test('returns the descriptor for valid input', () => {
    const desc = { geometry: { type: 'sphere' }, material: { type: 'lambert' } };
    expect(validateDescriptor(desc, 'test')).toEqual(desc);
  });

  test('returns null for unknown geometry type', () => {
    expect(validateDescriptor({ geometry: { type: 'invalid' }, material: { type: 'basic' } }, 'x')).toBeNull();
    expect(warnings.some(w => w.includes('unknown geometry type'))).toBe(true);
  });

  test('returns null for unknown material type', () => {
    expect(validateDescriptor({ geometry: { type: 'box' }, material: { type: 'invalid' } }, 'x')).toBeNull();
    expect(warnings.some(w => w.includes('unknown material type'))).toBe(true);
  });

  test('strips animations when material is not shader', () => {
    const desc = {
      geometry: { type: 'sphere' },
      material: { type: 'lambert' },
      animations: [{ uniform: 'u', from: 0, to: 1, duration: 1000 }]
    };
    const result = validateDescriptor(desc, 'test');
    expect(result.animations).toBeUndefined();
    expect(warnings.some(w => w.includes('animations require material type "shader"'))).toBe(true);
  });

  test('keeps animations when material is shader', () => {
    const anims = [{ uniform: 'u', from: 0, to: 1, duration: 1000 }];
    const desc = {
      geometry: { type: 'sphere' },
      material: { type: 'shader', vertexShader: '', fragmentShader: '' },
      animations: anims
    };
    const result = validateDescriptor(desc, 'test');
    expect(result.animations).toBe(anims);
  });
});

// ---------------------------------------------------------------------------
// buildGeometry
// ---------------------------------------------------------------------------

describe('buildGeometry', () => {
  test('creates SphereGeometry with defaults', () => {
    const geo = buildGeometry({ type: 'sphere' });
    expect(geo._className).toBe('SphereGeometry');
    expect(geo._args).toEqual([1, 16, 12]);
  });

  test('creates SphereGeometry with custom params', () => {
    const geo = buildGeometry({ type: 'sphere', params: { radius: 5, widthSegments: 32 } });
    expect(geo._args).toEqual([5, 32, 12]);
  });

  test('creates BoxGeometry', () => {
    const geo = buildGeometry({ type: 'box', params: { width: 2, height: 3, depth: 4 } });
    expect(geo._className).toBe('BoxGeometry');
    expect(geo._args).toEqual([2, 3, 4]);
  });

  test('creates CylinderGeometry', () => {
    const geo = buildGeometry({ type: 'cylinder' });
    expect(geo._className).toBe('CylinderGeometry');
  });

  test('creates ConeGeometry', () => {
    const geo = buildGeometry({ type: 'cone' });
    expect(geo._className).toBe('ConeGeometry');
  });

  test('creates TorusGeometry', () => {
    const geo = buildGeometry({ type: 'torus' });
    expect(geo._className).toBe('TorusGeometry');
  });

  test('creates PlaneGeometry', () => {
    const geo = buildGeometry({ type: 'plane' });
    expect(geo._className).toBe('PlaneGeometry');
  });

  test('creates RingGeometry', () => {
    const geo = buildGeometry({ type: 'ring' });
    expect(geo._className).toBe('RingGeometry');
  });

  test.each(['dodecahedron', 'icosahedron', 'octahedron', 'tetrahedron'])('creates %s geometry', (type) => {
    const geo = buildGeometry({ type });
    expect(geo._className).toBe(`${type.charAt(0).toUpperCase() + type.slice(1)}Geometry`);
  });
});

// ---------------------------------------------------------------------------
// resolveUniformValue
// ---------------------------------------------------------------------------

describe('resolveUniformValue', () => {
  test('resolves float', () => {
    expect(resolveUniformValue({ type: 'float', value: 1.5 })).toEqual({ value: 1.5 });
  });

  test('resolves int', () => {
    expect(resolveUniformValue({ type: 'int', value: 3 })).toEqual({ value: 3 });
  });

  test('resolves vec2', () => {
    const result = resolveUniformValue({ type: 'vec2', value: [1, 2] });
    expect(result.value._className).toBe('Vector2');
    expect(result.value.x).toBe(1);
    expect(result.value.y).toBe(2);
  });

  test('resolves vec3', () => {
    const result = resolveUniformValue({ type: 'vec3', value: [1, 2, 3] });
    expect(result.value._className).toBe('Vector3');
  });

  test('resolves vec4', () => {
    const result = resolveUniformValue({ type: 'vec4', value: [1, 2, 3, 4] });
    expect(result.value._className).toBe('Vector4');
  });

  test('resolves color', () => {
    const result = resolveUniformValue({ type: 'color', value: '#ff0000' });
    expect(result.value._className).toBe('Color');
    expect(result.value._color).toBe('#ff0000');
  });
});

// ---------------------------------------------------------------------------
// buildMaterial
// ---------------------------------------------------------------------------

describe('buildMaterial', () => {
  test('creates MeshBasicMaterial', () => {
    const mat = buildMaterial({ type: 'basic', color: '#ff0000' }, false);
    expect(mat._className).toBe('MeshBasicMaterial');
    expect(mat.color._color).toBe('#ff0000');
  });

  test('creates MeshLambertMaterial', () => {
    const mat = buildMaterial({ type: 'lambert' }, false);
    expect(mat._className).toBe('MeshLambertMaterial');
  });

  test('creates MeshPhongMaterial with shininess', () => {
    const mat = buildMaterial({ type: 'phong', shininess: 100 }, false);
    expect(mat._className).toBe('MeshPhongMaterial');
    expect(mat.shininess).toBe(100);
  });

  test('creates MeshStandardMaterial with metalness/roughness', () => {
    const mat = buildMaterial({ type: 'standard', metalness: 0.8, roughness: 0.2 }, false);
    expect(mat._className).toBe('MeshStandardMaterial');
    expect(mat.metalness).toBe(0.8);
    expect(mat.roughness).toBe(0.2);
  });

  test('creates ShaderMaterial with uniforms', () => {
    const mat = buildMaterial({
      type: 'shader',
      vertexShader: 'void main(){}',
      fragmentShader: 'void main(){}',
      uniforms: { intensity: { type: 'float', value: 1.0 } }
    }, false);
    expect(mat._className).toBe('ShaderMaterial');
    expect(mat.uniforms.intensity.value).toBe(1.0);
  });

  test('injects u_time when hasAnimations is true', () => {
    const mat = buildMaterial({
      type: 'shader',
      vertexShader: '',
      fragmentShader: ''
    }, true);
    expect(mat.uniforms.u_time).toBeDefined();
    expect(mat.uniforms.u_time.value).toBe(0.0);
  });

  test('does not overwrite existing u_time', () => {
    const mat = buildMaterial({
      type: 'shader',
      vertexShader: '',
      fragmentShader: '',
      uniforms: { u_time: { type: 'float', value: 5.0 } }
    }, true);
    expect(mat.uniforms.u_time.value).toBe(5.0);
  });
});

// ---------------------------------------------------------------------------
// buildMesh
// ---------------------------------------------------------------------------

describe('buildMesh', () => {
  test('creates a mesh with geometry and material', () => {
    const mesh = buildMesh({
      geometry: { type: 'sphere' },
      material: { type: 'basic' }
    });
    expect(mesh._className).toBe('Mesh');
    expect(mesh.geometry._className).toBe('SphereGeometry');
    expect(mesh.material._className).toBe('MeshBasicMaterial');
  });

  test('applies uniform scale', () => {
    const mesh = buildMesh({
      geometry: { type: 'box' },
      material: { type: 'basic' },
      scale: 2
    });
    expect(mesh.scale.x).toBe(2);
    expect(mesh.scale.y).toBe(2);
    expect(mesh.scale.z).toBe(2);
  });

  test('applies per-axis scale', () => {
    const mesh = buildMesh({
      geometry: { type: 'box' },
      material: { type: 'basic' },
      scale: [1, 2, 3]
    });
    expect(mesh.scale.x).toBe(1);
    expect(mesh.scale.y).toBe(2);
    expect(mesh.scale.z).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// DeclarativeTypeCache
// ---------------------------------------------------------------------------

describe('DeclarativeTypeCache', () => {
  test('caches geometry across calls for the same type', () => {
    const cache = new DeclarativeTypeCache();
    const desc = { geometry: { type: 'sphere' }, material: { type: 'basic' } };
    const mesh1 = cache.get('test', desc);
    const mesh2 = cache.get('test', desc);
    expect(mesh1.geometry).toBe(mesh2.geometry);
  });

  test('caches material across calls for the same type', () => {
    const cache = new DeclarativeTypeCache();
    const desc = { geometry: { type: 'sphere' }, material: { type: 'basic' } };
    const mesh1 = cache.get('test', desc);
    const mesh2 = cache.get('test', desc);
    expect(mesh1.material).toBe(mesh2.material);
  });

  test('creates different caches for different types', () => {
    const cache = new DeclarativeTypeCache();
    const desc1 = { geometry: { type: 'sphere' }, material: { type: 'basic' } };
    const desc2 = { geometry: { type: 'box' }, material: { type: 'lambert' } };
    const mesh1 = cache.get('a', desc1);
    const mesh2 = cache.get('b', desc2);
    expect(mesh1.geometry).not.toBe(mesh2.geometry);
    expect(mesh1.material).not.toBe(mesh2.material);
  });

  test('getMaterial returns cached material', () => {
    const cache = new DeclarativeTypeCache();
    const desc = { geometry: { type: 'sphere' }, material: { type: 'basic' } };
    cache.get('test', desc);
    expect(cache.getMaterial('test')).toBe(cache.getMaterial('test'));
    expect(cache.getMaterial('test')._className).toBe('MeshBasicMaterial');
  });

  test('dispose cleans up all resources', () => {
    const cache = new DeclarativeTypeCache();
    cache.get('a', { geometry: { type: 'sphere' }, material: { type: 'basic' } });
    cache.get('b', { geometry: { type: 'box' }, material: { type: 'lambert' } });

    const geos = [...cache._geometries.values()];
    const mats = [...cache._materials.values()];

    cache.dispose();

    geos.forEach(g => expect(g._disposed).toBe(true));
    mats.forEach(m => expect(m._disposed).toBe(true));
    expect(cache._geometries.size).toBe(0);
    expect(cache._materials.size).toBe(0);
  });

  test('applies scale from descriptor', () => {
    const cache = new DeclarativeTypeCache();
    const desc = { geometry: { type: 'sphere' }, material: { type: 'basic' }, scale: 3 };
    const mesh = cache.get('test', desc);
    expect(mesh.scale.x).toBe(3);
  });
});
