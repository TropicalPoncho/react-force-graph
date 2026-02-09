import fromKapsule from 'react-kapsule';
import ForceGraph3DKapsule from '3d-force-graph';
import { ForceGraph3DPropTypes } from '../../forcegraph-proptypes';
import withNodeObjectTypes from '../../node-object-types-resolver';

const ForceGraph3DBase = fromKapsule(
  ForceGraph3DKapsule,
  {
    methodNames: [ // bind methods
      'emitParticle',
      'd3Force',
      'd3ReheatSimulation',
      'stopAnimation',
      'pauseAnimation',
      'resumeAnimation',
      'cameraPosition',
      'zoomToFit',
      'getGraphBbox',
      'screen2GraphCoords',
      'graph2ScreenCoords',
      'postProcessingComposer',
      'lights',
      'scene',
      'camera',
      'renderer',
      'controls',
      'refresh'
    ],
    initPropNames: ['controlType', 'rendererConfig', 'extraRenderers']
  }
);

const ForceGraph3D = withNodeObjectTypes(ForceGraph3DBase);
ForceGraph3D.displayName = 'ForceGraph3D';
ForceGraph3D.propTypes = ForceGraph3DPropTypes;

export default ForceGraph3D;
