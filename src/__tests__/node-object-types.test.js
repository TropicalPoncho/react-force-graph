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

// ---------------------------------------------------------------------------
// Shared test suite runner
// ---------------------------------------------------------------------------
function runNodeObjectTypesTests(Component, mockFactory, displayName) {
  describe(`nodeObjectTypes – ${displayName}`, () => {
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

    test('handles non-function registry values gracefully', () => {
      const originalWarn = console.warn;
      const warnings = [];
      console.warn = (msg) => warnings.push(msg);

      const invalidRegistry = { user: () => userObject, broken: 'not-a-function' };
      render(<Component nodeObjectTypes={invalidRegistry} />);
      const accessor = getResolvedAccessor(mockFactory);

      expect(accessor({ id: '1', threeObjectType: 'user' })).toBe(userObject);
      expect(accessor({ id: '2', threeObjectType: 'broken' })).toBeUndefined();
      expect(warnings.some(w => w.includes('non-function values'))).toBe(true);

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
  });
}

// ---------------------------------------------------------------------------
// Run the shared test suite for each component
// ---------------------------------------------------------------------------
runNodeObjectTypesTests(ForceGraph3D, mock3D, 'ForceGraph3D');
runNodeObjectTypesTests(ForceGraphVR, mockVR, 'ForceGraphVR');
runNodeObjectTypesTests(ForceGraphAR, mockAR, 'ForceGraphAR');
