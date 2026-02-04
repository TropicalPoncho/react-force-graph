export { default as ForceGraphVR } from './packages/react-force-graph-vr';
export { default as ForceGraphAR } from './packages/react-force-graph-ar';
export { default as ForceGraph3D } from './packages/react-force-graph-3d';
export { default as ForceGraph2D } from './packages/react-force-graph-2d';

// Data loading HOC and types
export {
  default as withGraphDataLoader,
  GraphDataLoaderConfig,
  GraphDataLoaderMethods,
  WithLoaderProps,
  FetchParams,
  CacheOptions
} from './graph-data-loader';

// Pre-wrapped components with data loading
import * as React from 'react';
import { ForceGraphProps as FG2DProps, ForceGraphMethods as FG2DMethods } from './packages/react-force-graph-2d';
import { ForceGraphProps as FG3DProps, ForceGraphMethods as FG3DMethods } from './packages/react-force-graph-3d';
import { ForceGraphProps as FGVRProps, ForceGraphMethods as FGVRMethods } from './packages/react-force-graph-vr';
import { ForceGraphProps as FGARProps, ForceGraphMethods as FGARMethods } from './packages/react-force-graph-ar';
import { WithLoaderProps, GraphDataLoaderMethods } from './graph-data-loader';

type WithLoaderRef<M> = M & GraphDataLoaderMethods;

export declare const ForceGraph2DWithLoader: <NT = {}, LT = {}>(
  props: FG2DProps<NT, LT> & WithLoaderProps<NT, LT> & { ref?: React.Ref<WithLoaderRef<FG2DMethods<NT, LT>>> }
) => React.ReactElement;

export declare const ForceGraph3DWithLoader: <NT = {}, LT = {}>(
  props: FG3DProps<NT, LT> & WithLoaderProps<NT, LT> & { ref?: React.Ref<WithLoaderRef<FG3DMethods<NT, LT>>> }
) => React.ReactElement;

export declare const ForceGraphVRWithLoader: <NT = {}, LT = {}>(
  props: FGVRProps<NT, LT> & WithLoaderProps<NT, LT> & { ref?: React.Ref<WithLoaderRef<FGVRMethods<NT, LT>>> }
) => React.ReactElement;

export declare const ForceGraphARWithLoader: <NT = {}, LT = {}>(
  props: FGARProps<NT, LT> & WithLoaderProps<NT, LT> & { ref?: React.Ref<WithLoaderRef<FGARMethods<NT, LT>>> }
) => React.ReactElement;