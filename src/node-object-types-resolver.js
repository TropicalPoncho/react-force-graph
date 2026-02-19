import React, { forwardRef, useMemo, useRef, useEffect } from 'react';
import { isDescriptor, validateDescriptor, DeclarativeTypeCache } from './node-object-definition-builder.js';
import { NodeAnimationManager } from './node-object-definition-animator.js';

/**
 * Wraps a kapsule-based force-graph component so that when `nodeObjectTypes`
 * is provided, it is resolved into a `nodeThreeObject` accessor function.
 *
 * Resolution rules:
 *   1. Explicit `nodeThreeObject` prop is present  →  passed through as-is (registry ignored).
 *   2. `nodeObjectTypes` is provided               →  per-node accessor: looks up node.threeObjectType
 *      in the map, calls the factory if found, or builds a mesh from a descriptor, otherwise
 *      returns undefined (default sphere).
 *   3. Neither is provided                         →  no `nodeThreeObject` set (default sphere).
 *
 * Entries in `nodeObjectTypes` can be:
 *   - Functions (legacy): `(node) => Object3D`
 *   - Descriptors (declarative): `{ geometry, material, animations?, scale? }`
 */
export default function withNodeObjectTypes(KapsuleComponent) {
  const Wrapped = forwardRef(function WithNodeObjectTypes(props, ref) {
    const { nodeObjectTypes, nodeThreeObject, ...restProps } = props;

    const cacheRef = useRef(null);
    const animatorRef = useRef(null);

    const resolvedNodeThreeObject = useMemo(() => {
      if (nodeThreeObject != null) return nodeThreeObject;
      if (!nodeObjectTypes) return undefined;

      // Validate the registry shape
      if (typeof nodeObjectTypes !== 'object' || nodeObjectTypes === null || Array.isArray(nodeObjectTypes)) {
        console.warn('nodeObjectTypes must be a plain object mapping type strings to factory functions or descriptors. Ignoring invalid registry.');
        return undefined;
      }

      // Dispose previous resources
      if (cacheRef.current) cacheRef.current.dispose();
      if (animatorRef.current) animatorRef.current.dispose();

      const cache = new DeclarativeTypeCache();
      const animator = new NodeAnimationManager();
      cacheRef.current = cache;
      animatorRef.current = animator;

      // Partition entries
      const functionEntries = {};
      const descriptorEntries = {};

      for (const [key, entry] of Object.entries(nodeObjectTypes)) {
        if (typeof entry === 'function') {
          functionEntries[key] = entry;
        } else if (isDescriptor(entry)) {
          const validated = validateDescriptor(entry, key);
          if (validated) {
            descriptorEntries[key] = validated;
            // Register animated types
            if (validated.animations && validated.animations.length > 0 && validated.material.type === 'shader') {
              animator.registerType(key, validated.animations);
            }
          }
        } else {
          console.warn(`nodeObjectTypes["${key}"] is neither a factory function nor a valid descriptor. Ignoring.`);
        }
      }

      // Start animation loop if any animated types exist
      if (animator.hasAnimatedTypes()) {
        animator.start();
      }

      return (node) => {
        const typeName = node.threeObjectType;

        // Check function entries first
        const factory = functionEntries[typeName];
        if (typeof factory === 'function') return factory(node);

        // Check descriptor entries
        const descriptor = descriptorEntries[typeName];
        if (descriptor) {
          const mesh = cache.get(typeName, descriptor);
          // Register material with animator if this type has animations
          if (descriptor.animations && descriptor.animations.length > 0 && descriptor.material.type === 'shader') {
            animator.registerMaterial(typeName, mesh.material);
          }
          return mesh;
        }

        return undefined; // fallback to default sphere
      };
    }, [nodeThreeObject, nodeObjectTypes]);

    // Cleanup on unmount or when nodeObjectTypes changes
    useEffect(() => {
      return () => {
        if (cacheRef.current) cacheRef.current.dispose();
        if (animatorRef.current) animatorRef.current.dispose();
      };
    }, [nodeObjectTypes]);

    return (
      <KapsuleComponent
        ref={ref}
        {...restProps}
        {...(resolvedNodeThreeObject != null ? { nodeThreeObject: resolvedNodeThreeObject } : {})}
      />
    );
  });

  Wrapped.displayName = KapsuleComponent.displayName || KapsuleComponent.name || 'WithNodeObjectTypes';
  Wrapped.propTypes = KapsuleComponent.propTypes;

  return Wrapped;
}
