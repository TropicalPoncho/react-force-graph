import React, { createRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import ForceGraphAR from '../packages/react-force-graph-ar/index.js';
import { _mockFactory as mockKapsule } from '3d-force-graph-ar';

afterEach(cleanup);

const sampleGraphData = {
  nodes: [{ id: 'a' }, { id: 'b' }],
  links: [{ source: 'a', target: 'b' }]
};

describe('ForceGraphAR', () => {
  test('renders without crashing', () => {
    const { container } = render(<ForceGraphAR />);
    expect(container.firstChild).toBeTruthy();
  });

  test('renders a div wrapper element', () => {
    const { container } = render(<ForceGraphAR />);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  test('has correct displayName', () => {
    expect(ForceGraphAR.displayName).toBe('ForceGraphAR');
  });

  test('passes graphData prop to kapsule instance', () => {
    render(<ForceGraphAR graphData={sampleGraphData} />);
    const instance = mockKapsule._lastInstance();
    expect(instance.graphData).toHaveBeenCalledWithArgs(sampleGraphData);
  });

  test('passes AR-specific props', () => {
    render(
      <ForceGraphAR
        yOffset={1.5}
        glScale={200}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.yOffset).toHaveBeenCalledWithArgs(1.5);
    expect(instance.glScale).toHaveBeenCalledWithArgs(200);
  });

  test('passes markerAttrs as init prop (not called as setter)', () => {
    const markerAttrs = { type: 'pattern', patternUrl: 'marker.patt' };
    render(<ForceGraphAR markerAttrs={markerAttrs} />);
    const instance = mockKapsule._lastInstance();
    expect(instance._configOptions).toEqual({ markerAttrs });
  });

  test('passes three.js props', () => {
    render(
      <ForceGraphAR
        nodeOpacity={0.7}
        nodeResolution={8}
        linkOpacity={0.4}
        numDimensions={3}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeOpacity).toHaveBeenCalledWithArgs(0.7);
    expect(instance.nodeResolution).toHaveBeenCalledWithArgs(8);
    expect(instance.linkOpacity).toHaveBeenCalledWithArgs(0.4);
    expect(instance.numDimensions).toHaveBeenCalledWithArgs(3);
  });

  test('passes node and link styling props', () => {
    render(
      <ForceGraphAR
        nodeColor="green"
        nodeLabel="title"
        linkColor="orange"
        linkWidth={3}
        linkDirectionalArrowLength={10}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeColor).toHaveBeenCalledWithArgs('green');
    expect(instance.nodeLabel).toHaveBeenCalledWithArgs('title');
    expect(instance.linkColor).toHaveBeenCalledWithArgs('orange');
    expect(instance.linkWidth).toHaveBeenCalledWithArgs(3);
    expect(instance.linkDirectionalArrowLength).toHaveBeenCalledWithArgs(10);
  });

  test('passes interaction callbacks', () => {
    const onNodeClick = () => {};
    const onLinkClick = () => {};
    const onEngineTick = () => {};
    const onEngineStop = () => {};

    render(
      <ForceGraphAR
        onNodeClick={onNodeClick}
        onLinkClick={onLinkClick}
        onEngineTick={onEngineTick}
        onEngineStop={onEngineStop}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.onNodeClick).toHaveBeenCalledWithArgs(onNodeClick);
    expect(instance.onLinkClick).toHaveBeenCalledWithArgs(onLinkClick);
    expect(instance.onEngineTick).toHaveBeenCalledWithArgs(onEngineTick);
    expect(instance.onEngineStop).toHaveBeenCalledWithArgs(onEngineStop);
  });

  test('exposes imperative methods via ref', () => {
    const ref = createRef();
    render(<ForceGraphAR ref={ref} />);

    expect(ref.current).toBeTruthy();
    const methods = ['d3Force', 'd3ReheatSimulation', 'emitParticle', 'refresh', 'getGraphBbox'];
    methods.forEach(method => {
      expect(typeof ref.current[method]).toBe('function');
    });
  });

  test('updates props on re-render', () => {
    const { rerender } = render(<ForceGraphAR glScale={100} />);
    const instance = mockKapsule._lastInstance();

    instance.glScale.mockClear();

    rerender(<ForceGraphAR glScale={200} />);
    expect(instance.glScale).toHaveBeenCalledWithArgs(200);
  });
});
