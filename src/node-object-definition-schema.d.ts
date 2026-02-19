import { Object3D } from 'three';

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export type GeometryType =
  | 'sphere' | 'box' | 'cylinder' | 'cone' | 'torus'
  | 'plane' | 'ring'
  | 'dodecahedron' | 'icosahedron' | 'octahedron' | 'tetrahedron';

export interface SphereGeometryParams {
  radius?: number;
  widthSegments?: number;
  heightSegments?: number;
}

export interface BoxGeometryParams {
  width?: number;
  height?: number;
  depth?: number;
}

export interface CylinderGeometryParams {
  radiusTop?: number;
  radiusBottom?: number;
  height?: number;
  radialSegments?: number;
}

export interface ConeGeometryParams {
  radius?: number;
  height?: number;
  radialSegments?: number;
}

export interface TorusGeometryParams {
  radius?: number;
  tube?: number;
  radialSegments?: number;
  tubularSegments?: number;
}

export interface PlaneGeometryParams {
  width?: number;
  height?: number;
}

export interface RingGeometryParams {
  innerRadius?: number;
  outerRadius?: number;
}

export type GeometryParamsMap = {
  sphere: SphereGeometryParams;
  box: BoxGeometryParams;
  cylinder: CylinderGeometryParams;
  cone: ConeGeometryParams;
  torus: TorusGeometryParams;
  plane: PlaneGeometryParams;
  ring: RingGeometryParams;
  dodecahedron: { radius?: number; detail?: number };
  icosahedron: { radius?: number; detail?: number };
  octahedron: { radius?: number; detail?: number };
  tetrahedron: { radius?: number; detail?: number };
};

export interface GeometryDescriptor<T extends GeometryType = GeometryType> {
  type: T;
  params?: GeometryParamsMap[T];
}

// ---------------------------------------------------------------------------
// Uniforms
// ---------------------------------------------------------------------------

export type UniformType = 'float' | 'int' | 'vec2' | 'vec3' | 'vec4' | 'color';

export type UniformValue =
  | number
  | [number, number]
  | [number, number, number]
  | [number, number, number, number]
  | string;

export interface UniformDescriptor {
  type: UniformType;
  value: UniformValue;
}

// ---------------------------------------------------------------------------
// Animations
// ---------------------------------------------------------------------------

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'sine' | 'bounce';
export type LoopMode = 'once' | 'loop' | 'pingPong';

export interface UniformAnimationDescriptor {
  uniform: string;
  from: number | number[];
  to: number | number[];
  duration: number;
  easing?: EasingType;
  loop?: LoopMode;
  delay?: number;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

export type StandardMaterialType = 'standard' | 'lambert' | 'phong' | 'basic';

export interface StandardMaterialDescriptor {
  type: StandardMaterialType;
  color?: string;
  opacity?: number;
  transparent?: boolean;
  wireframe?: boolean;
  emissive?: string;
  emissiveIntensity?: number;
  metalness?: number;
  roughness?: number;
  shininess?: number;
}

export interface ShaderMaterialDescriptor {
  type: 'shader';
  vertexShader: string;
  fragmentShader: string;
  uniforms?: Record<string, UniformDescriptor>;
  transparent?: boolean;
  wireframe?: boolean;
  side?: 'front' | 'back' | 'double';
}

export type MaterialDescriptor = StandardMaterialDescriptor | ShaderMaterialDescriptor;

// ---------------------------------------------------------------------------
// Node Type Descriptor
// ---------------------------------------------------------------------------

export interface NodeTypeDescriptor {
  geometry: GeometryDescriptor;
  material: MaterialDescriptor;
  animations?: UniformAnimationDescriptor[];
  scale?: number | [number, number, number];
}

// ---------------------------------------------------------------------------
// Combined map type (backward compatible)
// ---------------------------------------------------------------------------

export type NodeObjectTypeEntry<NodeType = {}> =
  | ((node: NodeType & { [key: string]: any }) => Object3D)
  | NodeTypeDescriptor;

export type NodeObjectTypeMap<NodeType = {}> = Record<string, NodeObjectTypeEntry<NodeType>>;
