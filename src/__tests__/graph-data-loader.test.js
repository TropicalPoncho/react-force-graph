import { jest } from '@jest/globals';
import React, { createRef } from 'react';
import { render, cleanup, act } from '@testing-library/react';
import ForceGraph2D from '../packages/react-force-graph-2d/index.js';
import { _mockFactory as mockKapsule } from 'force-graph';
import withGraphDataLoader from '../graph-data-loader.js';

const ForceGraph2DWithLoader = withGraphDataLoader(ForceGraph2D);

const sampleGraphData = {
  nodes: [{ id: 'a' }, { id: 'b' }],
  links: [{ source: 'a', target: 'b' }]
};

const neighborData = {
  nodes: [{ id: 'c' }, { id: 'd' }],
  links: [{ source: 'a', target: 'c' }, { source: 'b', target: 'd' }]
};

function createTrackedFn(impl) {
  const calls = [];
  function tracked(...args) {
    calls.push(args);
    return impl ? impl(...args) : undefined;
  }
  tracked._calls = calls;
  tracked.callCount = () => calls.length;
  tracked.lastCall = () => calls[calls.length - 1];
  tracked.calledWith = (...expected) => calls.some(
    callArgs => callArgs.length === expected.length &&
      callArgs.every((arg, i) => Object.is(arg, expected[i]))
  );
  return tracked;
}

function mockFetch(data = sampleGraphData, options = {}) {
  const { ok = true, status = 200, statusText = 'OK' } = options;
  return createTrackedFn(() => {
    return Promise.resolve({
      ok,
      status,
      statusText,
      json: () => Promise.resolve(data)
    });
  });
}

beforeEach(() => {
  global.fetch = mockFetch();
});

afterEach(() => {
  cleanup();
  delete global.fetch;
});

describe('withGraphDataLoader', () => {
  describe('backwards compatibility', () => {
    test('without dataLoader prop, passes graphData through unchanged', () => {
      render(<ForceGraph2DWithLoader graphData={sampleGraphData} />);
      const instance = mockKapsule._lastInstance();
      expect(instance.graphData).toHaveBeenCalledWithArgs(sampleGraphData);
    });

    test('without dataLoader prop, does not call fetch', () => {
      render(<ForceGraph2DWithLoader graphData={sampleGraphData} />);
      expect(global.fetch.callCount()).toBe(0);
    });

    test('without dataLoader prop, passes onNodeClick through', () => {
      const onClick = createTrackedFn();
      render(<ForceGraph2DWithLoader graphData={sampleGraphData} onNodeClick={onClick} />);
      const instance = mockKapsule._lastInstance();
      expect(instance.onNodeClick).toHaveBeenCalledWithArgs(onClick);
    });
  });

  describe('initial fetch', () => {
    test('fetches data from configured URL on mount', async () => {
      global.fetch = mockFetch(sampleGraphData);

      await act(async () => {
        render(<ForceGraph2DWithLoader dataLoader={{ url: '/api/graph' }} />);
      });

      expect(global.fetch.callCount()).toBe(1);
      expect(global.fetch._calls[0][0]).toBe('/api/graph');
    });

    test('passes fetched data as graphData to wrapped component', async () => {
      global.fetch = mockFetch(sampleGraphData);

      await act(async () => {
        render(<ForceGraph2DWithLoader dataLoader={{ url: '/api/graph' }} />);
      });

      const instance = mockKapsule._lastInstance();
      const graphDataCalls = instance.graphData._calls;
      const lastCall = graphDataCalls[graphDataCalls.length - 1];
      expect(lastCall[0].nodes).toHaveLength(2);
      expect(lastCall[0].links).toHaveLength(1);
    });
  });

  describe('HTTP configuration', () => {
    test('uses GET method by default', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(<ForceGraph2DWithLoader dataLoader={{ url: '/api/graph' }} />);
      });

      expect(global.fetch._calls[0][1].method).toBe('GET');
    });

    test('supports POST method', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(<ForceGraph2DWithLoader dataLoader={{ url: '/api/graph', method: 'POST' }} />);
      });

      expect(global.fetch._calls[0][1].method).toBe('POST');
    });

    test('passes static headers', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{
              url: '/api/graph',
              headers: { 'Authorization': 'Bearer token123' }
            }}
          />
        );
      });

      const fetchHeaders = global.fetch._calls[0][1].headers;
      expect(fetchHeaders['Authorization']).toBe('Bearer token123');
    });

    test('supports function-based headers for dynamic auth', async () => {
      global.fetch = mockFetch();
      const getHeaders = () => ({ 'Authorization': 'Bearer dynamic-token' });

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', headers: getHeaders }}
          />
        );
      });

      const fetchHeaders = global.fetch._calls[0][1].headers;
      expect(fetchHeaders['Authorization']).toBe('Bearer dynamic-token');
    });

    test('uses custom buildRequest when provided', async () => {
      global.fetch = mockFetch();
      const buildRequest = createTrackedFn(() => ({
        method: 'PUT',
        headers: { 'X-Custom': 'yes' }
      }));

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', buildRequest }}
          />
        );
      });

      expect(buildRequest.callCount()).toBeGreaterThan(0);
      expect(global.fetch._calls[0][1].method).toBe('PUT');
    });

    test('uses custom parseResponse', async () => {
      global.fetch = mockFetch({ data: { graph: sampleGraphData } });
      const parseResponse = (raw) => raw.data.graph;

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', parseResponse }}
          />
        );
      });

      const instance = mockKapsule._lastInstance();
      const graphDataCalls = instance.graphData._calls;
      const lastCall = graphDataCalls[graphDataCalls.length - 1];
      expect(lastCall[0].nodes).toHaveLength(2);
    });
  });

  describe('filters', () => {
    test('appends filters as query params for GET requests', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{
              url: '/api/graph',
              filters: { type: 'person', level: '3' }
            }}
          />
        );
      });

      const calledUrl = global.fetch._calls[0][0];
      expect(calledUrl).toContain('type=person');
      expect(calledUrl).toContain('level=3');
    });

    test('sends filters in body for POST requests', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{
              url: '/api/graph',
              method: 'POST',
              filters: { type: 'person' }
            }}
          />
        );
      });

      const body = JSON.parse(global.fetch._calls[0][1].body);
      expect(body.type).toBe('person');
    });

    test('uses buildFilterParams to transform filters', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{
              url: '/api/graph',
              filters: { type: 'person' },
              buildFilterParams: (f) => ({ query: JSON.stringify(f) })
            }}
          />
        );
      });

      const calledUrl = global.fetch._calls[0][0];
      expect(calledUrl).toContain('query=');
    });

    test('re-fetches when filters change', async () => {
      global.fetch = mockFetch();

      const { rerender } = await act(async () => {
        return render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', filters: { type: 'a' } }}
          />
        );
      });

      const firstCallCount = global.fetch.callCount();

      await act(async () => {
        rerender(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', filters: { type: 'b' } }}
          />
        );
      });

      expect(global.fetch.callCount()).toBeGreaterThan(firstCallCount);
    });

    test('clears cache when filters change so old data does not persist', async () => {
      const dataA = { nodes: [{ id: 'a1' }, { id: 'a2' }], links: [{ source: 'a1', target: 'a2' }] };
      const dataB = { nodes: [{ id: 'b1' }], links: [] };

      global.fetch = mockFetch(dataA);
      const ref = createRef();

      const { rerender } = await act(async () => {
        return render(
          <ForceGraph2DWithLoader
            ref={ref}
            dataLoader={{ url: '/api/graph', filters: { type: 'a' } }}
          />
        );
      });

      // After first fetch, should have dataA
      let loaded = ref.current.getLoadedData();
      expect(loaded.nodes).toHaveLength(2);

      // Switch to different filters with different response
      global.fetch = mockFetch(dataB);

      await act(async () => {
        rerender(
          <ForceGraph2DWithLoader
            ref={ref}
            dataLoader={{ url: '/api/graph', filters: { type: 'b' } }}
          />
        );
      });

      // After filter change, should only have dataB (cache was cleared)
      loaded = ref.current.getLoadedData();
      expect(loaded.nodes).toHaveLength(1);
      expect(loaded.nodes[0].id).toBe('b1');
      expect(loaded.links).toHaveLength(0);
    });
  });

  describe('cache', () => {
    test('does not re-fetch for identical request params', async () => {
      global.fetch = mockFetch();

      const { rerender } = await act(async () => {
        return render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', filters: { type: 'a' } }}
          />
        );
      });

      const callCount = global.fetch.callCount();

      // Re-render with same props
      await act(async () => {
        rerender(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', filters: { type: 'a' } }}
          />
        );
      });

      expect(global.fetch.callCount()).toBe(callCount);
    });
  });

  describe('lazy loading (expandOnNodeClick)', () => {
    test('calls fetchNeighbors on node click when expandOnNodeClick is true', async () => {
      global.fetch = mockFetch();
      const fetchNeighborsFn = createTrackedFn(() => Promise.resolve(neighborData));

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{
              url: '/api/graph',
              expandOnNodeClick: true,
              fetchNeighbors: fetchNeighborsFn
            }}
          />
        );
      });

      const instance = mockKapsule._lastInstance();
      const onNodeClickCalls = instance.onNodeClick._calls;
      expect(onNodeClickCalls.length).toBeGreaterThan(0);
      const handler = onNodeClickCalls[onNodeClickCalls.length - 1][0];

      // Simulate a node click
      await act(async () => {
        handler({ id: 'a' }, new MouseEvent('click'));
      });

      expect(fetchNeighborsFn.calledWith('a')).toBe(true);
    });

    test('does not re-fetch neighbors for already-expanded nodes', async () => {
      global.fetch = mockFetch();
      const fetchNeighborsFn = createTrackedFn(() => Promise.resolve(neighborData));

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{
              url: '/api/graph',
              expandOnNodeClick: true,
              fetchNeighbors: fetchNeighborsFn
            }}
          />
        );
      });

      const instance = mockKapsule._lastInstance();
      const handler = instance.onNodeClick._calls[instance.onNodeClick._calls.length - 1][0];

      // Click same node twice
      await act(async () => {
        handler({ id: 'a' }, new MouseEvent('click'));
      });

      await act(async () => {
        handler({ id: 'a' }, new MouseEvent('click'));
      });

      expect(fetchNeighborsFn.callCount()).toBe(1);
    });

    test('still calls user onNodeClick alongside expand', async () => {
      global.fetch = mockFetch();
      const userOnNodeClick = createTrackedFn();
      const fetchNeighborsFn = createTrackedFn(() => Promise.resolve(neighborData));

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            onNodeClick={userOnNodeClick}
            dataLoader={{
              url: '/api/graph',
              expandOnNodeClick: true,
              fetchNeighbors: fetchNeighborsFn
            }}
          />
        );
      });

      const instance = mockKapsule._lastInstance();
      const handler = instance.onNodeClick._calls[instance.onNodeClick._calls.length - 1][0];

      const node = { id: 'a' };
      const event = new MouseEvent('click');

      await act(async () => {
        handler(node, event);
      });

      expect(userOnNodeClick.calledWith(node, event)).toBe(true);
    });
  });

  describe('error handling', () => {
    test('calls onLoadError on fetch failure', async () => {
      global.fetch = createTrackedFn(() => Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({})
      }));
      const onLoadError = createTrackedFn();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{
              url: '/api/graph',
              onLoadError
            }}
          />
        );
      });

      expect(onLoadError.callCount()).toBeGreaterThan(0);
      expect(onLoadError._calls[0][0]).toBeInstanceOf(Error);
    });

    test('calls onLoadStart before fetch', async () => {
      global.fetch = mockFetch();
      const onLoadStart = createTrackedFn();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', onLoadStart }}
          />
        );
      });

      expect(onLoadStart.callCount()).toBeGreaterThan(0);
    });

    test('calls onLoadComplete after successful fetch', async () => {
      global.fetch = mockFetch();
      const onLoadComplete = createTrackedFn();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', onLoadComplete }}
          />
        );
      });

      expect(onLoadComplete.callCount()).toBeGreaterThan(0);
      const completedData = onLoadComplete._calls[0][0];
      expect(completedData.nodes).toHaveLength(2);
    });
  });

  describe('directGraphData precedence', () => {
    test('graphData prop takes precedence over loaded data', async () => {
      global.fetch = mockFetch();
      const directData = { nodes: [{ id: 'direct' }], links: [] };

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            graphData={directData}
            dataLoader={{ url: '/api/graph' }}
          />
        );
      });

      const instance = mockKapsule._lastInstance();
      const graphDataCalls = instance.graphData._calls;
      // All calls should have the direct data, not the fetched data
      graphDataCalls.forEach(call => {
        expect(call[0].nodes[0].id).toBe('direct');
      });
    });
  });

  describe('displayName and propTypes', () => {
    test('has correct displayName', () => {
      expect(ForceGraph2DWithLoader.displayName).toBe('WithGraphDataLoader(ForceGraph2D)');
    });

    test('merges propTypes from wrapped component and loader', () => {
      expect(ForceGraph2DWithLoader.propTypes).toBeDefined();
      expect(ForceGraph2DWithLoader.propTypes.dataLoader).toBeDefined();
      // Should still have original props
      expect(ForceGraph2DWithLoader.propTypes.graphData).toBeDefined();
    });
  });

  describe('ref methods', () => {
    test('exposes loader-specific methods via ref', async () => {
      global.fetch = mockFetch();
      const ref = createRef();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            ref={ref}
            dataLoader={{ url: '/api/graph' }}
          />
        );
      });

      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.loadMore).toBe('function');
      expect(typeof ref.current.clearCache).toBe('function');
      expect(typeof ref.current.getLoadedData).toBe('function');
      expect(typeof ref.current.isLoading).toBe('function');
      expect(typeof ref.current.getError).toBe('function');
      expect(typeof ref.current.loadNeighbors).toBe('function');
    });

    test('getLoadedData returns current graph state', async () => {
      global.fetch = mockFetch();
      const ref = createRef();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            ref={ref}
            dataLoader={{ url: '/api/graph' }}
          />
        );
      });

      const data = ref.current.getLoadedData();
      expect(data.nodes).toHaveLength(2);
      expect(data.links).toHaveLength(1);
    });

    test('clearCache resets graph data', async () => {
      global.fetch = mockFetch();
      const ref = createRef();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            ref={ref}
            dataLoader={{ url: '/api/graph' }}
          />
        );
      });

      await act(async () => {
        ref.current.clearCache();
      });

      const data = ref.current.getLoadedData();
      expect(data.nodes).toHaveLength(0);
      expect(data.links).toHaveLength(0);
    });
  });

  describe('polling', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('re-fetches at configured pollInterval', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', pollInterval: 5000 }}
          />
        );
      });

      const initialCalls = global.fetch.callCount();

      await act(async () => {
        jest.advanceTimersByTime(5000);
      });

      expect(global.fetch.callCount()).toBeGreaterThan(initialCalls);
    });

    test('does not poll when pollInterval is 0', async () => {
      global.fetch = mockFetch();

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', pollInterval: 0 }}
          />
        );
      });

      const initialCalls = global.fetch.callCount();

      await act(async () => {
        jest.advanceTimersByTime(10000);
      });

      expect(global.fetch.callCount()).toBe(initialCalls);
    });
  });

  describe('custom merge', () => {
    test('uses onDataMerge for custom merge strategy', async () => {
      global.fetch = mockFetch(sampleGraphData);
      const onDataMerge = createTrackedFn((existing, incoming) => ({
        nodes: [...existing.nodes, ...incoming.nodes.map(n => ({ ...n, merged: true }))],
        links: [...existing.links, ...incoming.links]
      }));

      await act(async () => {
        render(
          <ForceGraph2DWithLoader
            dataLoader={{ url: '/api/graph', onDataMerge }}
          />
        );
      });

      expect(onDataMerge.callCount()).toBeGreaterThan(0);
    });
  });

  describe('wrapping different components', () => {
    test('withGraphDataLoader can wrap any component', () => {
      const MockComponent = React.forwardRef((props, ref) => <div ref={ref}>mock</div>);
      MockComponent.displayName = 'MockGraph';

      const Wrapped = withGraphDataLoader(MockComponent);
      expect(Wrapped.displayName).toBe('WithGraphDataLoader(MockGraph)');

      const { container } = render(<Wrapped graphData={sampleGraphData} />);
      expect(container.firstChild).toBeTruthy();
    });
  });
});
