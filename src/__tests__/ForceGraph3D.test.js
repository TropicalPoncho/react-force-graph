import React, { createRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import ForceGraph3D from '../packages/react-force-graph-3d/index.js';
import { _mockFactory as mockKapsule } from '3d-force-graph';

afterEach(cleanup);

const sampleGraphData = {
  nodes: [{ id: 'a' }, { id: 'b' }],
  links: [{ source: 'a', target: 'b' }]
};

describe('ForceGraph3D', () => {
  test('renders without crashing', () => {
    const { container } = render(<ForceGraph3D />);
    expect(container.firstChild).toBeTruthy();
  });

  test('renders a div wrapper element', () => {
    const { container } = render(<ForceGraph3D />);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  test('has correct displayName', () => {
    expect(ForceGraph3D.displayName).toBe('ForceGraph3D');
  });

  test('passes graphData prop to kapsule instance', () => {
    render(<ForceGraph3D graphData={sampleGraphData} />);
    const instance = mockKapsule._lastInstance();
    expect(instance.graphData).toHaveBeenCalledWithArgs(sampleGraphData);
  });

  test('passes width and height props', () => {
    render(<ForceGraph3D width={800} height={600} />);
    const instance = mockKapsule._lastInstance();
    expect(instance.width).toHaveBeenCalledWithArgs(800);
    expect(instance.height).toHaveBeenCalledWithArgs(600);
  });

  test('passes 3D-specific three.js props', () => {
    const nodeThreeObject = () => {};
    render(
      <ForceGraph3D
        nodeOpacity={0.8}
        nodeResolution={16}
        nodeThreeObject={nodeThreeObject}
        nodeThreeObjectExtend={true}
        linkOpacity={0.5}
        linkResolution={8}
        numDimensions={3}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeOpacity).toHaveBeenCalledWithArgs(0.8);
    expect(instance.nodeResolution).toHaveBeenCalledWithArgs(16);
    expect(instance.nodeThreeObject).toHaveBeenCalledWithArgs(nodeThreeObject);
    expect(instance.nodeThreeObjectExtend).toHaveBeenCalledWithArgs(true);
    expect(instance.linkOpacity).toHaveBeenCalledWithArgs(0.5);
    expect(instance.linkResolution).toHaveBeenCalledWithArgs(8);
    expect(instance.numDimensions).toHaveBeenCalledWithArgs(3);
  });

  test('passes navigation props', () => {
    render(
      <ForceGraph3D
        showNavInfo={false}
        enableNavigationControls={true}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.showNavInfo).toHaveBeenCalledWithArgs(false);
    expect(instance.enableNavigationControls).toHaveBeenCalledWithArgs(true);
  });

  test('passes controlType as init prop (not called as setter)', () => {
    render(<ForceGraph3D controlType="orbit" />);
    const instance = mockKapsule._lastInstance();
    expect(instance._configOptions).toEqual({ controlType: 'orbit' });
  });

  test('passes interaction callback props', () => {
    const onNodeClick = () => {};
    const onNodeHover = () => {};
    const onNodeDrag = () => {};
    const onNodeDragEnd = () => {};
    const onLinkClick = () => {};
    const onBackgroundClick = () => {};

    render(
      <ForceGraph3D
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
        onNodeDrag={onNodeDrag}
        onNodeDragEnd={onNodeDragEnd}
        onLinkClick={onLinkClick}
        onBackgroundClick={onBackgroundClick}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.onNodeClick).toHaveBeenCalledWithArgs(onNodeClick);
    expect(instance.onNodeHover).toHaveBeenCalledWithArgs(onNodeHover);
    expect(instance.onNodeDrag).toHaveBeenCalledWithArgs(onNodeDrag);
    expect(instance.onNodeDragEnd).toHaveBeenCalledWithArgs(onNodeDragEnd);
    expect(instance.onLinkClick).toHaveBeenCalledWithArgs(onLinkClick);
    expect(instance.onBackgroundClick).toHaveBeenCalledWithArgs(onBackgroundClick);
  });

  test('passes force engine props', () => {
    render(
      <ForceGraph3D
        forceEngine="d3"
        d3AlphaMin={0.01}
        d3VelocityDecay={0.4}
        warmupTicks={100}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.forceEngine).toHaveBeenCalledWithArgs('d3');
    expect(instance.d3AlphaMin).toHaveBeenCalledWithArgs(0.01);
    expect(instance.d3VelocityDecay).toHaveBeenCalledWithArgs(0.4);
    expect(instance.warmupTicks).toHaveBeenCalledWithArgs(100);
  });

  test('exposes imperative methods via ref', () => {
    const ref = createRef();
    render(<ForceGraph3D ref={ref} />);

    expect(ref.current).toBeTruthy();
    const methods = [
      'cameraPosition', 'zoomToFit', 'd3Force', 'd3ReheatSimulation',
      'emitParticle', 'scene', 'camera', 'renderer', 'controls',
      'refresh', 'lights', 'postProcessingComposer',
      'getGraphBbox', 'screen2GraphCoords', 'graph2ScreenCoords',
      'stopAnimation', 'pauseAnimation', 'resumeAnimation'
    ];
    methods.forEach(method => {
      expect(typeof ref.current[method]).toBe('function');
    });
  });

  test('updates props on re-render', () => {
    const { rerender } = render(<ForceGraph3D nodeOpacity={1} />);
    const instance = mockKapsule._lastInstance();

    instance.nodeOpacity.mockClear();

    rerender(<ForceGraph3D nodeOpacity={0.5} />);
    expect(instance.nodeOpacity).toHaveBeenCalledWithArgs(0.5);
  });
});
