import React, { createRef } from 'react';
import { render, cleanup } from '@testing-library/react';
import ForceGraph2D from '../packages/react-force-graph-2d/index.js';
import { _mockFactory as mockKapsule } from 'force-graph';

afterEach(cleanup);

const sampleGraphData = {
  nodes: [{ id: 'a' }, { id: 'b' }],
  links: [{ source: 'a', target: 'b' }]
};

describe('ForceGraph2D', () => {
  test('renders without crashing', () => {
    const { container } = render(<ForceGraph2D />);
    expect(container.firstChild).toBeTruthy();
  });

  test('renders a div wrapper element', () => {
    const { container } = render(<ForceGraph2D />);
    expect(container.firstChild.tagName).toBe('DIV');
  });

  test('has correct displayName', () => {
    expect(ForceGraph2D.displayName).toBe('ForceGraph2D');
  });

  test('instantiates the underlying kapsule', () => {
    render(<ForceGraph2D />);
    expect(mockKapsule._instances.length).toBeGreaterThan(0);
  });

  test('passes graphData prop to kapsule instance', () => {
    render(<ForceGraph2D graphData={sampleGraphData} />);
    const instance = mockKapsule._lastInstance();
    expect(instance.graphData).toHaveBeenCalledWithArgs(sampleGraphData);
  });

  test('passes width and height props', () => {
    render(<ForceGraph2D width={800} height={600} />);
    const instance = mockKapsule._lastInstance();
    expect(instance.width).toHaveBeenCalledWithArgs(800);
    expect(instance.height).toHaveBeenCalledWithArgs(600);
  });

  test('passes backgroundColor prop', () => {
    render(<ForceGraph2D backgroundColor="#ff0000" />);
    const instance = mockKapsule._lastInstance();
    expect(instance.backgroundColor).toHaveBeenCalledWithArgs('#ff0000');
  });

  test('passes node styling props', () => {
    const nodeColor = (node) => node.color;
    render(
      <ForceGraph2D
        nodeRelSize={6}
        nodeVal={10}
        nodeLabel="name"
        nodeColor={nodeColor}
        nodeVisibility={true}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeRelSize).toHaveBeenCalledWithArgs(6);
    expect(instance.nodeVal).toHaveBeenCalledWithArgs(10);
    expect(instance.nodeLabel).toHaveBeenCalledWithArgs('name');
    expect(instance.nodeColor).toHaveBeenCalledWithArgs(nodeColor);
    expect(instance.nodeVisibility).toHaveBeenCalledWithArgs(true);
  });

  test('passes link styling props', () => {
    render(
      <ForceGraph2D
        linkColor="blue"
        linkWidth={2}
        linkCurvature={0.5}
        linkDirectionalArrowLength={5}
        linkDirectionalParticles={3}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.linkColor).toHaveBeenCalledWithArgs('blue');
    expect(instance.linkWidth).toHaveBeenCalledWithArgs(2);
    expect(instance.linkCurvature).toHaveBeenCalledWithArgs(0.5);
    expect(instance.linkDirectionalArrowLength).toHaveBeenCalledWithArgs(5);
    expect(instance.linkDirectionalParticles).toHaveBeenCalledWithArgs(3);
  });

  test('passes interaction callback props', () => {
    const onNodeClick = () => {};
    const onNodeHover = () => {};
    const onLinkClick = () => {};
    const onLinkHover = () => {};
    const onBackgroundClick = () => {};

    render(
      <ForceGraph2D
        onNodeClick={onNodeClick}
        onNodeHover={onNodeHover}
        onLinkClick={onLinkClick}
        onLinkHover={onLinkHover}
        onBackgroundClick={onBackgroundClick}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.onNodeClick).toHaveBeenCalledWithArgs(onNodeClick);
    expect(instance.onNodeHover).toHaveBeenCalledWithArgs(onNodeHover);
    expect(instance.onLinkClick).toHaveBeenCalledWithArgs(onLinkClick);
    expect(instance.onLinkHover).toHaveBeenCalledWithArgs(onLinkHover);
    expect(instance.onBackgroundClick).toHaveBeenCalledWithArgs(onBackgroundClick);
  });

  test('passes force engine props', () => {
    const onEngineTick = () => {};
    const onEngineStop = () => {};

    render(
      <ForceGraph2D
        d3AlphaMin={0.01}
        d3AlphaDecay={0.02}
        d3VelocityDecay={0.3}
        warmupTicks={50}
        cooldownTicks={100}
        cooldownTime={5000}
        onEngineTick={onEngineTick}
        onEngineStop={onEngineStop}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.d3AlphaMin).toHaveBeenCalledWithArgs(0.01);
    expect(instance.d3AlphaDecay).toHaveBeenCalledWithArgs(0.02);
    expect(instance.d3VelocityDecay).toHaveBeenCalledWithArgs(0.3);
    expect(instance.warmupTicks).toHaveBeenCalledWithArgs(50);
    expect(instance.cooldownTicks).toHaveBeenCalledWithArgs(100);
    expect(instance.cooldownTime).toHaveBeenCalledWithArgs(5000);
    expect(instance.onEngineTick).toHaveBeenCalledWithArgs(onEngineTick);
    expect(instance.onEngineStop).toHaveBeenCalledWithArgs(onEngineStop);
  });

  test('passes 2D-specific canvas props', () => {
    const nodeCanvasObject = () => {};
    const linkCanvasObject = () => {};

    render(
      <ForceGraph2D
        nodeCanvasObjectMode="replace"
        nodeCanvasObject={nodeCanvasObject}
        linkCanvasObjectMode="after"
        linkCanvasObject={linkCanvasObject}
        autoPauseRedraw={false}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.nodeCanvasObjectMode).toHaveBeenCalledWithArgs('replace');
    expect(instance.nodeCanvasObject).toHaveBeenCalledWithArgs(nodeCanvasObject);
    expect(instance.linkCanvasObjectMode).toHaveBeenCalledWithArgs('after');
    expect(instance.linkCanvasObject).toHaveBeenCalledWithArgs(linkCanvasObject);
    expect(instance.autoPauseRedraw).toHaveBeenCalledWithArgs(false);
  });

  test('passes zoom and pan interaction props', () => {
    const onZoom = () => {};
    const onZoomEnd = () => {};

    render(
      <ForceGraph2D
        minZoom={0.5}
        maxZoom={10}
        enableZoomInteraction={true}
        enablePanInteraction={false}
        onZoom={onZoom}
        onZoomEnd={onZoomEnd}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.minZoom).toHaveBeenCalledWithArgs(0.5);
    expect(instance.maxZoom).toHaveBeenCalledWithArgs(10);
    expect(instance.enableZoomInteraction).toHaveBeenCalledWithArgs(true);
    expect(instance.enablePanInteraction).toHaveBeenCalledWithArgs(false);
    expect(instance.onZoom).toHaveBeenCalledWithArgs(onZoom);
    expect(instance.onZoomEnd).toHaveBeenCalledWithArgs(onZoomEnd);
  });

  test('passes DAG mode props', () => {
    render(
      <ForceGraph2D
        dagMode="td"
        dagLevelDistance={50}
      />
    );
    const instance = mockKapsule._lastInstance();
    expect(instance.dagMode).toHaveBeenCalledWithArgs('td');
    expect(instance.dagLevelDistance).toHaveBeenCalledWithArgs(50);
  });

  test('exposes imperative methods via ref', () => {
    const ref = createRef();
    render(<ForceGraph2D ref={ref} />);

    expect(ref.current).toBeTruthy();
    const methods = [
      'zoomToFit', 'centerAt', 'zoom', 'd3Force', 'd3ReheatSimulation',
      'emitParticle', 'pauseAnimation', 'resumeAnimation', 'stopAnimation',
      'getGraphBbox', 'screen2GraphCoords', 'graph2ScreenCoords'
    ];
    methods.forEach(method => {
      expect(typeof ref.current[method]).toBe('function');
    });
  });

  test('updates props on re-render', () => {
    const { rerender } = render(<ForceGraph2D backgroundColor="#000" />);
    const instance = mockKapsule._lastInstance();

    instance.backgroundColor.mockClear();

    rerender(<ForceGraph2D backgroundColor="#fff" />);
    expect(instance.backgroundColor).toHaveBeenCalledWithArgs('#fff');
  });

  test('does not re-propagate unchanged props', () => {
    const { rerender } = render(<ForceGraph2D backgroundColor="#000" width={500} />);
    const instance = mockKapsule._lastInstance();

    instance.backgroundColor.mockClear();
    instance.width.mockClear();

    rerender(<ForceGraph2D backgroundColor="#000" width={600} />);
    expect(instance.backgroundColor).not.toHaveBeenMockCalled();
    expect(instance.width).toHaveBeenCalledWithArgs(600);
  });
});
