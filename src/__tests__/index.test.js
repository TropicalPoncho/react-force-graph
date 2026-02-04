import React from 'react';
import { render, cleanup } from '@testing-library/react';
import {
  ForceGraph2D, ForceGraph3D, ForceGraphVR, ForceGraphAR,
  withGraphDataLoader,
  ForceGraph2DWithLoader, ForceGraph3DWithLoader, ForceGraphVRWithLoader, ForceGraphARWithLoader
} from '../index.js';

afterEach(cleanup);

describe('Main entry point exports', () => {
  test('exports ForceGraph2D', () => {
    expect(ForceGraph2D).toBeDefined();
    expect(ForceGraph2D.displayName).toBe('ForceGraph2D');
  });

  test('exports ForceGraph3D', () => {
    expect(ForceGraph3D).toBeDefined();
    expect(ForceGraph3D.displayName).toBe('ForceGraph3D');
  });

  test('exports ForceGraphVR', () => {
    expect(ForceGraphVR).toBeDefined();
    expect(ForceGraphVR.displayName).toBe('ForceGraphVR');
  });

  test('exports ForceGraphAR', () => {
    expect(ForceGraphAR).toBeDefined();
    expect(ForceGraphAR.displayName).toBe('ForceGraphAR');
  });

  test('all exports are React components (forwardRef objects)', () => {
    [ForceGraph2D, ForceGraph3D, ForceGraphVR, ForceGraphAR].forEach(Component => {
      expect(Component.$$typeof).toBeDefined();
    });
  });

  test('all components render without crashing', () => {
    [ForceGraph2D, ForceGraph3D, ForceGraphVR, ForceGraphAR].forEach(Component => {
      const { container } = render(<Component />);
      expect(container.firstChild).toBeTruthy();
      cleanup();
    });
  });
});

describe('Data loader exports', () => {
  test('exports withGraphDataLoader as a function', () => {
    expect(withGraphDataLoader).toBeDefined();
    expect(typeof withGraphDataLoader).toBe('function');
  });

  test('exports ForceGraph2DWithLoader', () => {
    expect(ForceGraph2DWithLoader).toBeDefined();
    expect(ForceGraph2DWithLoader.displayName).toBe('WithGraphDataLoader(ForceGraph2D)');
  });

  test('exports ForceGraph3DWithLoader', () => {
    expect(ForceGraph3DWithLoader).toBeDefined();
    expect(ForceGraph3DWithLoader.displayName).toBe('WithGraphDataLoader(ForceGraph3D)');
  });

  test('exports ForceGraphVRWithLoader', () => {
    expect(ForceGraphVRWithLoader).toBeDefined();
    expect(ForceGraphVRWithLoader.displayName).toBe('WithGraphDataLoader(ForceGraphVR)');
  });

  test('exports ForceGraphARWithLoader', () => {
    expect(ForceGraphARWithLoader).toBeDefined();
    expect(ForceGraphARWithLoader.displayName).toBe('WithGraphDataLoader(ForceGraphAR)');
  });

  test('all loader-wrapped components are React components (forwardRef objects)', () => {
    [ForceGraph2DWithLoader, ForceGraph3DWithLoader, ForceGraphVRWithLoader, ForceGraphARWithLoader].forEach(Component => {
      expect(Component.$$typeof).toBeDefined();
    });
  });

  test('all loader-wrapped components render without crashing', () => {
    const graphData = { nodes: [{ id: 'a' }], links: [] };
    [ForceGraph2DWithLoader, ForceGraph3DWithLoader, ForceGraphVRWithLoader, ForceGraphARWithLoader].forEach(Component => {
      const { container } = render(<Component graphData={graphData} />);
      expect(container.firstChild).toBeTruthy();
      cleanup();
    });
  });
});
