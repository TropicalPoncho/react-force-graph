import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { ForceGraph2D, ForceGraph3D, ForceGraphVR, ForceGraphAR } from '../index.js';

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
