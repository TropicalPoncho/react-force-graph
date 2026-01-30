import React, { createRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import ForceGraphVR from '../packages/react-force-graph-vr/index.js';
import { _mockFactory as mockKapsule } from '3d-force-graph-vr';

afterEach(cleanup);

const sampleGraphData = {
  nodes: [{ id: 'a' }, { id: 'b' }],
  links: [{ source: 'a', target: 'b' }]
};

describe('ForceGraphVR', () => {
  test('renders without crashing', () => {
    const { container } = render(<ForceGraphVR />);
    expect(container.firstChild).toBeTruthy();
  });

  test('renders a div wrapper element', () => {
    const { container } = render(<ForceGraphVR />);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  test('has correct displayName', () => {
    expect(ForceGraphVR.displayName).toBe('ForceGraphVR');
  });

  test('passes graphData prop to kapsule instance', () => {
    render(<ForceGraphVR graphData={sampleGraphData} />);
    const instance = mockKapsule._lastInstance();
    expect(instance.graphData).toHaveBeenCalledWithArgs(sampleGraphData);
  });

  test('passes VR-specific description props', () => {
    const nodeDesc = (node) => node.description;
    render(
      <ForceGraphVR
        nodeDesc={nodeDesc}
        linkDesc="type"
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeDesc).toHaveBeenCalledWithArgs(nodeDesc);
    expect(instance.linkDesc).toHaveBeenCalledWithArgs('type');
  });

  test('passes three.js props', () => {
    const nodeThreeObject = () => {};
    render(
      <ForceGraphVR
        nodeOpacity={0.9}
        nodeResolution={12}
        nodeThreeObject={nodeThreeObject}
        linkOpacity={0.6}
        numDimensions={3}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeOpacity).toHaveBeenCalledWithArgs(0.9);
    expect(instance.nodeResolution).toHaveBeenCalledWithArgs(12);
    expect(instance.nodeThreeObject).toHaveBeenCalledWithArgs(nodeThreeObject);
    expect(instance.linkOpacity).toHaveBeenCalledWithArgs(0.6);
    expect(instance.numDimensions).toHaveBeenCalledWithArgs(3);
  });

  test('passes node and link styling props', () => {
    render(
      <ForceGraphVR
        nodeColor="red"
        nodeLabel="name"
        nodeVal={5}
        linkColor="blue"
        linkWidth={2}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeColor).toHaveBeenCalledWithArgs('red');
    expect(instance.nodeLabel).toHaveBeenCalledWithArgs('name');
    expect(instance.nodeVal).toHaveBeenCalledWithArgs(5);
    expect(instance.linkColor).toHaveBeenCalledWithArgs('blue');
    expect(instance.linkWidth).toHaveBeenCalledWithArgs(2);
  });

  test('passes interaction callbacks', () => {
    const onNodeClick = () => {};
    const onNodeHover = () => {};
    const onLinkClick = () => {};

    render(
      <ForceGraphVR
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
        onLinkClick={onLinkClick}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.onNodeClick).toHaveBeenCalledWithArgs(onNodeClick);
    expect(instance.onNodeHover).toHaveBeenCalledWithArgs(onNodeHover);
    expect(instance.onLinkClick).toHaveBeenCalledWithArgs(onLinkClick);
  });

  test('exposes imperative methods via ref', () => {
    const ref = createRef();
    render(<ForceGraphVR ref={ref} />);

    expect(ref.current).toBeTruthy();
    const methods = ['d3Force', 'd3ReheatSimulation', 'emitParticle', 'refresh', 'getGraphBbox'];
    methods.forEach(method => {
      expect(typeof ref.current[method]).toBe('function');
    });
  });

  test('updates props on re-render', () => {
    const { rerender } = render(<ForceGraphVR backgroundColor="#000" />);
    const instance = mockKapsule._lastInstance();

    instance.backgroundColor.mockClear();

    rerender(<ForceGraphVR backgroundColor="#111" />);
    expect(instance.backgroundColor).toHaveBeenCalledWithArgs('#111');
  });
});
