import fromKapsule from 'react-kapsule';
import ForceGraphVRKapsule from '3d-force-graph-vr';
import { ForceGraphVRPropTypes } from '../../forcegraph-proptypes';
import withNodeObjectTypes from '../../node-object-types-resolver';

const ForceGraphVRBase = fromKapsule(
  ForceGraphVRKapsule,
  {
    methodNames: [ // bind methods
      'getGraphBbox',
      'emitParticle',
      'd3Force',
      'd3ReheatSimulation',
      'refresh'
    ]
  }
);

const ForceGraphVR = withNodeObjectTypes(ForceGraphVRBase);
ForceGraphVR.displayName = 'ForceGraphVR';
ForceGraphVR.propTypes = ForceGraphVRPropTypes;

export default ForceGraphVR;
