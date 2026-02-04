import GraphDataCache from '../graph-data-cache.js';

describe('GraphDataCache', () => {
  describe('construction', () => {
    test('creates with default options', () => {
      const cache = new GraphDataCache();
      expect(cache.nodeCount).toBe(0);
      expect(cache.linkCount).toBe(0);
    });

    test('creates with custom options', () => {
      const cache = new GraphDataCache({
        nodeIdField: 'uid',
        maxAge: 5000,
        maxNodes: 100
      });
      expect(cache.nodeCount).toBe(0);
    });
  });

  describe('node operations', () => {
    test('adds and retrieves nodes by id', () => {
      const cache = new GraphDataCache();
      cache.addNodes([{ id: 'a' }, { id: 'b' }]);
      expect(cache.hasNode('a')).toBe(true);
      expect(cache.hasNode('b')).toBe(true);
      expect(cache.hasNode('c')).toBe(false);
      expect(cache.nodeCount).toBe(2);
    });

    test('deduplicates nodes by id', () => {
      const cache = new GraphDataCache();
      cache.addNodes([{ id: 'a', val: 1 }]);
      cache.addNodes([{ id: 'a', val: 2 }, { id: 'b', val: 3 }]);
      expect(cache.nodeCount).toBe(2);
      const data = cache.toGraphData();
      const nodeA = data.nodes.find(n => n.id === 'a');
      expect(nodeA.val).toBe(2); // updated with latest
    });

    test('skips nodes without id', () => {
      const cache = new GraphDataCache();
      cache.addNodes([{ name: 'no-id' }, { id: 'a' }]);
      expect(cache.nodeCount).toBe(1);
    });

    test('uses custom nodeIdField', () => {
      const cache = new GraphDataCache({ nodeIdField: 'uid' });
      cache.addNodes([{ uid: 'x', name: 'test' }]);
      expect(cache.hasNode('x')).toBe(true);
      expect(cache.nodeCount).toBe(1);
    });
  });

  describe('link operations', () => {
    test('adds and retrieves links', () => {
      const cache = new GraphDataCache();
      cache.addLinks([{ source: 'a', target: 'b' }]);
      expect(cache.hasLink('a', 'b')).toBe(true);
      expect(cache.hasLink('b', 'a')).toBe(false);
      expect(cache.linkCount).toBe(1);
    });

    test('deduplicates links by source::target key', () => {
      const cache = new GraphDataCache();
      cache.addLinks([
        { source: 'a', target: 'b', weight: 1 },
        { source: 'a', target: 'b', weight: 2 }
      ]);
      expect(cache.linkCount).toBe(1);
      const data = cache.toGraphData();
      expect(data.links[0].weight).toBe(2); // updated
    });

    test('handles object-type source/target (with .id)', () => {
      const cache = new GraphDataCache();
      cache.addLinks([{ source: { id: 'a' }, target: { id: 'b' } }]);
      expect(cache.hasLink('a', 'b')).toBe(true);
    });

    test('uses custom linkIdField function', () => {
      const cache = new GraphDataCache({
        linkIdField: (link) => `${link.from}-${link.to}`
      });
      cache.addLinks([{ from: 'x', to: 'y', source: 'x', target: 'y' }]);
      expect(cache.linkCount).toBe(1);
    });
  });

  describe('merge', () => {
    test('merges nodes and links together', () => {
      const cache = new GraphDataCache();
      cache.merge({
        nodes: [{ id: 'a' }, { id: 'b' }],
        links: [{ source: 'a', target: 'b' }]
      });
      expect(cache.nodeCount).toBe(2);
      expect(cache.linkCount).toBe(1);
    });

    test('merges multiple batches without duplicates', () => {
      const cache = new GraphDataCache();
      cache.merge({
        nodes: [{ id: 'a' }],
        links: [{ source: 'a', target: 'b' }]
      });
      cache.merge({
        nodes: [{ id: 'a' }, { id: 'c' }],
        links: [{ source: 'a', target: 'b' }, { source: 'a', target: 'c' }]
      });
      expect(cache.nodeCount).toBe(2); // a, c (a deduplicated)
      expect(cache.linkCount).toBe(2); // a->b, a->c (a->b deduplicated)
    });

    test('handles missing nodes or links in merge', () => {
      const cache = new GraphDataCache();
      cache.merge({ nodes: [{ id: 'a' }] });
      expect(cache.nodeCount).toBe(1);
      expect(cache.linkCount).toBe(0);

      cache.merge({ links: [{ source: 'a', target: 'b' }] });
      expect(cache.linkCount).toBe(1);
    });
  });

  describe('toGraphData', () => {
    test('returns correct nodes and links arrays', () => {
      const cache = new GraphDataCache();
      cache.merge({
        nodes: [{ id: 'a', name: 'Alice' }, { id: 'b', name: 'Bob' }],
        links: [{ source: 'a', target: 'b' }]
      });
      const data = cache.toGraphData();
      expect(data.nodes).toHaveLength(2);
      expect(data.links).toHaveLength(1);
      expect(data.nodes.map(n => n.id).sort()).toEqual(['a', 'b']);
      expect(data.links[0].source).toBe('a');
      expect(data.links[0].target).toBe('b');
    });

    test('returns empty data from empty cache', () => {
      const cache = new GraphDataCache();
      const data = cache.toGraphData();
      expect(data).toEqual({ nodes: [], links: [] });
    });
  });

  describe('staleness (maxAge)', () => {
    test('marks entries as stale after maxAge', () => {
      const cache = new GraphDataCache({ maxAge: 100 });
      cache.addNodes([{ id: 'a' }]);
      expect(cache.hasNode('a')).toBe(true);

      // Manually set fetchedAt to the past
      const entry = cache._nodes.get('a');
      entry.fetchedAt = Date.now() - 200;

      expect(cache.hasNode('a')).toBe(false);
      expect(cache.nodeCount).toBe(0); // cleaned up on access
    });

    test('stale nodes excluded from toGraphData', () => {
      const cache = new GraphDataCache({ maxAge: 100 });
      cache.addNodes([{ id: 'a' }, { id: 'b' }]);

      // Make only 'a' stale
      cache._nodes.get('a').fetchedAt = Date.now() - 200;

      const data = cache.toGraphData();
      expect(data.nodes).toHaveLength(1);
      expect(data.nodes[0].id).toBe('b');
    });

    test('stale links excluded from toGraphData', () => {
      const cache = new GraphDataCache({ maxAge: 100 });
      cache.addLinks([{ source: 'a', target: 'b' }]);

      cache._links.get('a::b').fetchedAt = Date.now() - 200;

      const data = cache.toGraphData();
      expect(data.links).toHaveLength(0);
    });

    test('infinite maxAge never marks entries as stale', () => {
      const cache = new GraphDataCache(); // default: Infinity
      cache.addNodes([{ id: 'a' }]);

      const entry = cache._nodes.get('a');
      entry.fetchedAt = 0; // very old

      expect(cache.hasNode('a')).toBe(true);
    });
  });

  describe('eviction (maxNodes)', () => {
    test('evicts oldest nodes when exceeding maxNodes', () => {
      const cache = new GraphDataCache({ maxNodes: 3 });

      cache.addNodes([{ id: 'a' }]);
      cache._nodes.get('a').accessedAt = 1;

      cache.addNodes([{ id: 'b' }]);
      cache._nodes.get('b').accessedAt = 2;

      cache.addNodes([{ id: 'c' }]);
      cache._nodes.get('c').accessedAt = 3;

      cache.addNodes([{ id: 'd' }]);
      cache._nodes.get('d').accessedAt = 4;

      expect(cache.nodeCount).toBe(3);
      expect(cache.hasNode('a')).toBe(false); // oldest evicted
      expect(cache.hasNode('b')).toBe(true);
      expect(cache.hasNode('c')).toBe(true);
      expect(cache.hasNode('d')).toBe(true);
    });

    test('does not evict when under maxNodes', () => {
      const cache = new GraphDataCache({ maxNodes: 10 });
      cache.addNodes([{ id: 'a' }, { id: 'b' }]);
      expect(cache.nodeCount).toBe(2);
    });
  });

  describe('eviction (maxLinks)', () => {
    test('evicts oldest links when exceeding maxLinks', () => {
      const cache = new GraphDataCache({ maxLinks: 2 });

      cache.addLinks([{ source: 'a', target: 'b' }]);
      cache._links.get('a::b').accessedAt = 1;

      cache.addLinks([{ source: 'b', target: 'c' }]);
      cache._links.get('b::c').accessedAt = 2;

      cache.addLinks([{ source: 'c', target: 'd' }]);
      cache._links.get('c::d').accessedAt = 3;

      expect(cache.linkCount).toBe(2);
      expect(cache.hasLink('a', 'b')).toBe(false); // oldest evicted
      expect(cache.hasLink('b', 'c')).toBe(true);
      expect(cache.hasLink('c', 'd')).toBe(true);
    });

    test('does not evict when under maxLinks', () => {
      const cache = new GraphDataCache({ maxLinks: 10 });
      cache.addLinks([
        { source: 'a', target: 'b' },
        { source: 'b', target: 'c' }
      ]);
      expect(cache.linkCount).toBe(2);
    });

    test('default maxLinks is unlimited', () => {
      const cache = new GraphDataCache();
      for (let i = 0; i < 100; i++) {
        cache.addLinks([{ source: `n${i}`, target: `n${i + 1}` }]);
      }
      expect(cache.linkCount).toBe(100);
    });
  });

  describe('neighborsFetched tracking', () => {
    test('tracks which nodes have had neighbors fetched', () => {
      const cache = new GraphDataCache();
      expect(cache.hasNeighborsFetched('a')).toBe(false);

      cache.markNeighborsFetched('a');
      expect(cache.hasNeighborsFetched('a')).toBe(true);
      expect(cache.hasNeighborsFetched('b')).toBe(false);
    });
  });

  describe('request tracking', () => {
    test('tracks request params', () => {
      const cache = new GraphDataCache();
      const params = JSON.stringify({ url: '/api', filters: {} });

      expect(cache.hasRequest(params)).toBe(false);
      cache.markRequest(params);
      expect(cache.hasRequest(params)).toBe(true);
    });

    test('isStaleRequest returns true for unknown requests', () => {
      const cache = new GraphDataCache();
      expect(cache.isStaleRequest('unknown')).toBe(true);
    });

    test('isStaleRequest returns false for fresh requests', () => {
      const cache = new GraphDataCache({ maxAge: 10000 });
      const params = 'test-params';
      cache.markRequest(params);
      expect(cache.isStaleRequest(params)).toBe(false);
    });

    test('isStaleRequest returns true for expired requests', () => {
      const cache = new GraphDataCache({ maxAge: 100 });
      const params = 'test-params';
      cache.markRequest(params);

      cache._requests.get(params).fetchedAt = Date.now() - 200;
      expect(cache.isStaleRequest(params)).toBe(true);
    });
  });

  describe('clear', () => {
    test('resets all internal state', () => {
      const cache = new GraphDataCache();
      cache.merge({
        nodes: [{ id: 'a' }],
        links: [{ source: 'a', target: 'b' }]
      });
      cache.markNeighborsFetched('a');
      cache.markRequest('some-params');

      cache.clear();

      expect(cache.nodeCount).toBe(0);
      expect(cache.linkCount).toBe(0);
      expect(cache.hasNeighborsFetched('a')).toBe(false);
      expect(cache.hasRequest('some-params')).toBe(false);
      expect(cache.toGraphData()).toEqual({ nodes: [], links: [] });
    });
  });
});
