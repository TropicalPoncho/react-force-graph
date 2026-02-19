import React from 'react';
import { render, cleanup } from '@testing-library/react';
import ForceGraph3D from '../packages/react-force-graph-3d/index.js';
import ForceGraphVR from '../packages/react-force-graph-vr/index.js';
import ForceGraphAR from '../packages/react-force-graph-ar/index.js';
import { _mockFactory as mock3D } from '3d-force-graph';
import { _mockFactory as mockVR } from '3d-force-graph-vr';
import { _mockFactory as mockAR } from '3d-force-graph-ar';

afterEach(cleanup);

// ---------------------------------------------------------------------------
// Shared fixtures and helpers
// ---------------------------------------------------------------------------
const userObject   = { uuid: 'user-obj' };
const serverObject = { uuid: 'server-obj' };
const nodeObjectTypes = {
  user:   () => userObject,
  server: () => serverObject
};

function getResolvedAccessor(mockFactory) {
  return mockFactory._lastInstance().nodeThreeObject._calls[0][0];
}

// Mock rAF for declarative node tests (animator needs it)
beforeEach(() => {
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  global.cancelAnimationFrame = (id) => clearTimeout(id);
});
afterEach(() => {
  delete global.requestAnimationFrame;
  delete global.cancelAnimationFrame;
});

// ---------------------------------------------------------------------------
// Shared test suite runner
// ---------------------------------------------------------------------------
function runNodeObjectTypesTests(Component, mockFactory, displayName) {
  describe(`nodeObjectTypes – ${displayName}`, () => {
    // === Legacy function-based tests ===

    test('resolves node.threeObjectType to the matching factory object', () => {
      render(<Component nodeObjectTypes={nodeObjectTypes} />);
      const accessor = getResolvedAccessor(mockFactory);

      expect(typeof accessor).toBe('function');
      expect(accessor({ id: '1', threeObjectType: 'user'   })).toBe(userObject);
      expect(accessor({ id: '2', threeObjectType: 'server' })).toBe(serverObject);
    });

    test('returns undefined for an unregistered threeObjectType', () => {
      render(<Component nodeObjectTypes={nodeObjectTypes} />);
      expect(getResolvedAccessor(mockFactory)({ id: '3', threeObjectType: 'unknown' })).toBeUndefined();
    });

    test('returns undefined when threeObjectType is absent', () => {
      render(<Component nodeObjectTypes={nodeObjectTypes} />);
      expect(getResolvedAccessor(mockFactory)({ id: '4' })).toBeUndefined();
    });

    test('explicit nodeThreeObject takes precedence over nodeObjectTypes', () => {
      const explicitAccessor = () => ({ uuid: 'explicit' });
      render(<Component nodeObjectTypes={nodeObjectTypes} nodeThreeObject={explicitAccessor} />);
      const instance = mockFactory._lastInstance();
      expect(instance.nodeThreeObject).toHaveBeenCalledWithArgs(explicitAccessor);
    });

    test('factory receives the full node object', () => {
      const receivedNodes = [];
      const registry = { user: (n) => { receivedNodes.push(n); return userObject; } };
      render(<Component nodeObjectTypes={registry} />);

      const node = { id: 'test', threeObjectType: 'user', label: 'TestNode' };
      getResolvedAccessor(mockFactory)(node);
      expect(receivedNodes).toEqual([node]);
    });

    test('handles non-function/non-descriptor registry values gracefully', () => {
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (msg) => warnings.push(msg);

      const invalidRegistry = { user: () => userObject, broken: 'not-a-function' };
      render(<Component nodeObjectTypes={invalidRegistry} />);
      const accessor = getResolvedAccessor(mockFactory);

      expect(accessor({ id: '1', threeObjectType: 'user' })).toBe(userObject);
      expect(accessor({ id: '2', threeObjectType: 'broken' })).toBeUndefined();
      expect(warnings.some(w => w.includes('neither a factory function nor a valid descriptor'))).toBe(true);

      console.warn = originalWarn;
    });

    test('ignores invalid registry types', () => {
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (msg) => warnings.push(msg);

      render(<Component nodeObjectTypes={null} />);
      expect(mockFactory._lastInstance().nodeThreeObject._calls.length).toBe(0);

      render(<Component nodeObjectTypes={[]} />);
      expect(warnings.some(w => w.includes('must be a plain object'))).toBe(true);

      console.warn = originalWarn;
    });

    // === Declarative descriptor tests ===

    test('resolves a descriptor entry to a mesh object', () => {
      const descriptorRegistry = {
        server: {
          geometry: { type: 'box', params: { width: 10, height: 10, depth: 10 } },
          material: { type: 'basic', color: '#3498db' }
        }
      };
      render(<Component nodeObjectTypes={descriptorRegistry} />);
      const accessor = getResolvedAccessor(mockFactory);

      const result = accessor({ id: 's1', threeObjectType: 'server' });
      expect(result).toBeDefined();
      expect(result._className).toBe('Mesh');
      expect(result.geometry._className).toBe('BoxGeometry');
      expect(result.material._className).toBe('MeshBasicMaterial');
    });

    test('mixed registry: functions and descriptors coexist', () => {
      const mixedRegistry = {
        user: () => userObject,
        server: {
          geometry: { type: 'sphere' },
          material: { type: 'lambert' }
        }
      };
      render(<Component nodeObjectTypes={mixedRegistry} />);
      const accessor = getResolvedAccessor(mockFactory);

      expect(accessor({ id: '1', threeObjectType: 'user' })).toBe(userObject);
      const serverMesh = accessor({ id: '2', threeObjectType: 'server' });
      expect(serverMesh._className).toBe('Mesh');
      expect(serverMesh.geometry._className).toBe('SphereGeometry');
    });

    test('descriptor with shader material and animations creates ShaderMaterial', () => {
      const shaderRegistry = {
        alert: {
          geometry: { type: 'sphere' },
          material: {
            type: 'shader',
            vertexShader: 'void main(){ gl_Position = vec4(0); }',
            fragmentShader: 'void main(){ gl_FragColor = vec4(1); }',
            uniforms: { u_intensity: { type: 'float', value: 1.0 } }
          },
          animations: [
            { uniform: 'u_intensity', from: 0.5, to: 1.5, duration: 2000, loop: 'pingPong' }
          ]
        }
      };
      render(<Component nodeObjectTypes={shaderRegistry} />);
      const accessor = getResolvedAccessor(mockFactory);

      const mesh = accessor({ id: 'a1', threeObjectType: 'alert' });
      expect(mesh._className).toBe('Mesh');
      expect(mesh.material._className).toBe('ShaderMaterial');
      expect(mesh.material.uniforms.u_time).toBeDefined();
      expect(mesh.material.uniforms.u_intensity).toBeDefined();
    });

    test('descriptor with invalid geometry type warns and is ignored', () => {
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (msg) => warnings.push(msg);

      const badRegistry = {
        bad: {
          geometry: { type: 'nonexistent' },
          material: { type: 'basic' }
        }
      };
      render(<Component nodeObjectTypes={badRegistry} />);
      const accessor = getResolvedAccessor(mockFactory);

      expect(accessor({ id: '1', threeObjectType: 'bad' })).toBeUndefined();
      expect(warnings.some(w => w.includes('unknown geometry type'))).toBe(true);

      console.warn = originalWarn;
    });

    test('descriptor with scale applies scale to mesh', () => {
      const scaledRegistry = {
        big: {
          geometry: { type: 'sphere' },
          material: { type: 'basic' },
          scale: 3
        }
      };
      render(<Component nodeObjectTypes={scaledRegistry} />);
      const accessor = getResolvedAccessor(mockFactory);

      const mesh = accessor({ id: '1', threeObjectType: 'big' });
      expect(mesh.scale.x).toBe(3);
      expect(mesh.scale.y).toBe(3);
      expect(mesh.scale.z).toBe(3);
    });

    test('explicit nodeThreeObject takes precedence over descriptors', () => {
      const explicitAccessor = () => ({ uuid: 'explicit' });
      const descriptorRegistry = {
        server: {
          geometry: { type: 'box' },
          material: { type: 'basic' }
        }
      };
      render(<Component nodeObjectTypes={descriptorRegistry} nodeThreeObject={explicitAccessor} />);
      const instance = mockFactory._lastInstance();
      expect(instance.nodeThreeObject).toHaveBeenCalledWithArgs(explicitAccessor);
    });
  });
}

// ---------------------------------------------------------------------------
// Run the shared test suite for each component
// ---------------------------------------------------------------------------
runNodeObjectTypesTests(ForceGraph3D, mock3D, 'ForceGraph3D');
runNodeObjectTypesTests(ForceGraphVR, mockVR, 'ForceGraphVR');
runNodeObjectTypesTests(ForceGraphAR, mockAR, 'ForceGraphAR');
