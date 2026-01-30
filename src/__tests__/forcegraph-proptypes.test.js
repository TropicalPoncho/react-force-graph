import {
  ForceGraph2DPropTypes,
  ForceGraph3DPropTypes,
  ForceGraphVRPropTypes,
  ForceGraphARPropTypes
} from '../forcegraph-proptypes';

describe('ForceGraph PropTypes', () => {
  const commonProps = [
    'width', 'height', 'graphData', 'backgroundColor',
    'nodeRelSize', 'nodeId', 'nodeLabel', 'nodeVal', 'nodeVisibility',
    'nodeColor', 'nodeAutoColorBy',
    'onNodeHover', 'onNodeClick',
    'linkSource', 'linkTarget', 'linkLabel', 'linkVisibility',
    'linkColor', 'linkAutoColorBy', 'linkWidth', 'linkCurvature',
    'linkDirectionalArrowLength', 'linkDirectionalArrowColor',
    'linkDirectionalArrowRelPos', 'linkDirectionalParticles',
    'linkDirectionalParticleSpeed', 'linkDirectionalParticleOffset',
    'linkDirectionalParticleWidth', 'linkDirectionalParticleColor',
    'onLinkHover', 'onLinkClick',
    'dagMode', 'dagLevelDistance', 'dagNodeFilter', 'onDagError',
    'd3AlphaMin', 'd3AlphaDecay', 'd3VelocityDecay',
    'warmupTicks', 'cooldownTicks', 'cooldownTime',
    'onEngineTick', 'onEngineStop', 'getGraphBbox'
  ];

  const pointerProps = [
    'zoomToFit', 'onNodeRightClick', 'onNodeDrag', 'onNodeDragEnd',
    'onLinkRightClick', 'linkHoverPrecision',
    'onBackgroundClick', 'onBackgroundRightClick',
    'showPointerCursor', 'enablePointerInteraction', 'enableNodeDrag'
  ];

  const threeProps = [
    'showNavInfo', 'nodeOpacity', 'nodeResolution',
    'nodeThreeObject', 'nodeThreeObjectExtend', 'nodePositionUpdate',
    'linkOpacity', 'linkResolution', 'linkCurveRotation',
    'linkMaterial', 'linkThreeObject', 'linkThreeObjectExtend',
    'linkPositionUpdate', 'linkDirectionalArrowResolution',
    'linkDirectionalParticleResolution', 'linkDirectionalParticleThreeObject',
    'forceEngine', 'ngraphPhysics', 'numDimensions'
  ];

  describe('ForceGraph2DPropTypes', () => {
    test('includes all common props', () => {
      commonProps.forEach(prop => {
        expect(ForceGraph2DPropTypes).toHaveProperty(prop);
      });
    });

    test('includes pointer-based props', () => {
      pointerProps.forEach(prop => {
        expect(ForceGraph2DPropTypes).toHaveProperty(prop);
      });
    });

    test('includes 2D-specific canvas props', () => {
      ['nodeCanvasObjectMode', 'nodeCanvasObject', 'nodePointerAreaPaint',
       'linkCanvasObjectMode', 'linkCanvasObject', 'linkPointerAreaPaint',
       'autoPauseRedraw', 'minZoom', 'maxZoom',
       'enableZoomInteraction', 'enablePanInteraction',
       'onZoom', 'onZoomEnd', 'onRenderFramePre', 'onRenderFramePost',
       'linkLineDash', 'linkDirectionalParticleCanvasObject'
      ].forEach(prop => {
        expect(ForceGraph2DPropTypes).toHaveProperty(prop);
      });
    });

    test('does not include three.js props', () => {
      ['nodeThreeObject', 'linkThreeObject', 'nodeOpacity', 'linkOpacity']
        .forEach(prop => {
          expect(ForceGraph2DPropTypes).not.toHaveProperty(prop);
        });
    });
  });

  describe('ForceGraph3DPropTypes', () => {
    test('includes all common props', () => {
      commonProps.forEach(prop => {
        expect(ForceGraph3DPropTypes).toHaveProperty(prop);
      });
    });

    test('includes pointer-based props', () => {
      pointerProps.forEach(prop => {
        expect(ForceGraph3DPropTypes).toHaveProperty(prop);
      });
    });

    test('includes three.js props', () => {
      threeProps.forEach(prop => {
        expect(ForceGraph3DPropTypes).toHaveProperty(prop);
      });
    });

    test('includes 3D-specific props', () => {
      ['enableNavigationControls', 'controlType', 'rendererConfig', 'extraRenderers']
        .forEach(prop => {
          expect(ForceGraph3DPropTypes).toHaveProperty(prop);
        });
    });
  });

  describe('ForceGraphVRPropTypes', () => {
    test('includes all common props', () => {
      commonProps.forEach(prop => {
        expect(ForceGraphVRPropTypes).toHaveProperty(prop);
      });
    });

    test('includes three.js props', () => {
      threeProps.forEach(prop => {
        expect(ForceGraphVRPropTypes).toHaveProperty(prop);
      });
    });

    test('includes VR-specific description props', () => {
      expect(ForceGraphVRPropTypes).toHaveProperty('nodeDesc');
      expect(ForceGraphVRPropTypes).toHaveProperty('linkDesc');
    });

    test('does not include pointer-based props', () => {
      ['onNodeDrag', 'onNodeDragEnd', 'enableNodeDrag', 'onBackgroundClick']
        .forEach(prop => {
          expect(ForceGraphVRPropTypes).not.toHaveProperty(prop);
        });
    });
  });

  describe('ForceGraphARPropTypes', () => {
    test('includes all common props', () => {
      commonProps.forEach(prop => {
        expect(ForceGraphARPropTypes).toHaveProperty(prop);
      });
    });

    test('includes three.js props', () => {
      threeProps.forEach(prop => {
        expect(ForceGraphARPropTypes).toHaveProperty(prop);
      });
    });

    test('includes AR-specific props', () => {
      expect(ForceGraphARPropTypes).toHaveProperty('markerAttrs');
      expect(ForceGraphARPropTypes).toHaveProperty('yOffset');
      expect(ForceGraphARPropTypes).toHaveProperty('glScale');
    });

    test('does not include pointer-based props', () => {
      ['onNodeDrag', 'onNodeDragEnd', 'enableNodeDrag', 'onBackgroundClick']
        .forEach(prop => {
          expect(ForceGraphARPropTypes).not.toHaveProperty(prop);
        });
    });
  });
});
