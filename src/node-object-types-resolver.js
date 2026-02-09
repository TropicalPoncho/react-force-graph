import React, { forwardRef, useMemo } from 'react';

/**
 * Wraps a kapsule-based force-graph component so that when `nodeObjectTypes`
 * is provided, it is resolved into a `nodeThreeObject` accessor function.
 *
 * Resolution rules:
 *   1. Explicit `nodeThreeObject` prop is present  →  passed through as-is (registry ignored).
 *   2. `nodeObjectTypes` is provided               →  per-node accessor: looks up node.threeObjectType
 *      in the map, calls the factory if found, otherwise returns undefined (default sphere).
 *   3. Neither is provided                         →  no `nodeThreeObject` set (default sphere).
 */
export default function withNodeObjectTypes(KapsuleComponent) {
  const Wrapped = forwardRef(function WithNodeObjectTypes(props, ref) {
    const { nodeObjectTypes, nodeThreeObject, ...restProps } = props;

    const resolvedNodeThreeObject = useMemo(() => {
      if (nodeThreeObject != null) return nodeThreeObject;
      if (!nodeObjectTypes) return undefined;

      // Validate the registry shape
      if (typeof nodeObjectTypes !== 'object' || nodeObjectTypes === null || Array.isArray(nodeObjectTypes)) {
        console.warn('nodeObjectTypes must be a plain object mapping type strings to factory functions. Ignoring invalid registry.');
        return undefined;
      }

      // Warn about non-function values but proceed (they'll just return undefined at lookup time)
      const invalidKeys = Object.keys(nodeObjectTypes).filter(key => typeof nodeObjectTypes[key] !== 'function');
      if (invalidKeys.length > 0) {
        console.warn(`nodeObjectTypes contains non-function values for keys: ${invalidKeys.join(', ')}. These will be ignored.`);
      }

      return (node) => {
        const factory = nodeObjectTypes[node.threeObjectType];
        return (typeof factory === 'function') ? factory(node) : undefined;
      };
    }, [nodeThreeObject, nodeObjectTypes]);

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
