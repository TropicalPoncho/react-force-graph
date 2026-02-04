// Load VR first to avoid three.js collisions
export { default as ForceGraphVR } from './packages/react-force-graph-vr/index.js';
export { default as ForceGraphAR } from './packages/react-force-graph-ar/index.js';
export { default as ForceGraph3D } from './packages/react-force-graph-3d/index.js';
export { default as ForceGraph2D } from './packages/react-force-graph-2d/index.js';

// Data loading HOC
export { default as withGraphDataLoader } from './graph-data-loader.js';

// Pre-wrapped components with data loading
import withGraphDataLoader from './graph-data-loader.js';
import _ForceGraph2D from './packages/react-force-graph-2d/index.js';
import _ForceGraph3D from './packages/react-force-graph-3d/index.js';
import _ForceGraphVR from './packages/react-force-graph-vr/index.js';
import _ForceGraphAR from './packages/react-force-graph-ar/index.js';

export const ForceGraph2DWithLoader = withGraphDataLoader(_ForceGraph2D);
export const ForceGraph3DWithLoader = withGraphDataLoader(_ForceGraph3D);
export const ForceGraphVRWithLoader = withGraphDataLoader(_ForceGraphVR);
export const ForceGraphARWithLoader = withGraphDataLoader(_ForceGraphAR);