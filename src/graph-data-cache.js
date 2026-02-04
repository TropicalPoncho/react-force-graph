function resolveId(nodeOrId) {
  return (typeof nodeOrId === 'object' && nodeOrId !== null) ? nodeOrId.id : nodeOrId;
}

export default class GraphDataCache {
  constructor(options = {}) {
    this._nodeIdField = options.nodeIdField || 'id';
    this._linkIdFn = typeof options.linkIdField === 'function'
      ? options.linkIdField
      : (link) => `${resolveId(link.source)}::${resolveId(link.target)}`;
    this._maxAge = options.maxAge != null ? options.maxAge : Infinity;
    this._maxNodes = options.maxNodes != null ? options.maxNodes : Infinity;
    this._maxLinks = options.maxLinks != null ? options.maxLinks : Infinity;

    this._nodes = new Map();            // id -> { data, fetchedAt, accessedAt }
    this._links = new Map();            // compositeKey -> { data, fetchedAt, accessedAt }
    this._neighborsFetched = new Set(); // set of node ids whose neighbors have been loaded
    this._requests = new Map();         // serializedParams -> { fetchedAt }
  }

  // --- Node operations ---

  hasNode(id) {
    if (!this._nodes.has(id)) return false;
    const entry = this._nodes.get(id);
    if (this._isEntryStale(entry)) {
      this._nodes.delete(id);
      return false;
    }
    return true;
  }

  addNodes(nodes) {
    const now = Date.now();
    for (const node of nodes) {
      const id = node[this._nodeIdField];
      if (id == null) continue;
      this._nodes.set(id, { data: node, fetchedAt: now, accessedAt: now });
    }
    this._evictIfNeeded();
  }

  // --- Link operations ---

  hasLink(source, target) {
    const key = `${resolveId(source)}::${resolveId(target)}`;
    if (!this._links.has(key)) return false;
    const entry = this._links.get(key);
    if (this._isEntryStale(entry)) {
      this._links.delete(key);
      return false;
    }
    return true;
  }

  addLinks(links) {
    const now = Date.now();
    for (const link of links) {
      const key = this._linkIdFn(link);
      if (key == null) continue;
      this._links.set(key, { data: link, fetchedAt: now, accessedAt: now });
    }
    this._evictLinksIfNeeded();
  }

  // --- Neighbor tracking ---

  hasNeighborsFetched(nodeId) {
    return this._neighborsFetched.has(nodeId);
  }

  markNeighborsFetched(nodeId) {
    this._neighborsFetched.add(nodeId);
  }

  // --- Request tracking ---

  hasRequest(serializedParams) {
    return this._requests.has(serializedParams);
  }

  isStaleRequest(serializedParams) {
    if (!this._requests.has(serializedParams)) return true;
    const entry = this._requests.get(serializedParams);
    return this._isEntryStale(entry);
  }

  markRequest(serializedParams) {
    this._requests.set(serializedParams, { fetchedAt: Date.now() });
  }

  // --- Merge & materialize ---

  merge(graphData) {
    if (graphData.nodes) this.addNodes(graphData.nodes);
    if (graphData.links) this.addLinks(graphData.links);
  }

  toGraphData() {
    const now = Date.now();
    const nodes = [];
    for (const [id, entry] of this._nodes) {
      if (this._isEntryStale(entry)) {
        this._nodes.delete(id);
      } else {
        entry.accessedAt = now;
        nodes.push(entry.data);
      }
    }

    const links = [];
    for (const [key, entry] of this._links) {
      if (this._isEntryStale(entry)) {
        this._links.delete(key);
      } else {
        entry.accessedAt = now;
        links.push(entry.data);
      }
    }

    return { nodes, links };
  }

  // --- Clear ---

  clear() {
    this._nodes.clear();
    this._links.clear();
    this._neighborsFetched.clear();
    this._requests.clear();
  }

  // --- Internal helpers ---

  _isEntryStale(entry) {
    if (this._maxAge === Infinity) return false;
    return (Date.now() - entry.fetchedAt) > this._maxAge;
  }

  _evictIfNeeded() {
    if (this._nodes.size <= this._maxNodes) return;

    // Sort by accessedAt ascending (oldest first) and evict
    const entries = [...this._nodes.entries()]
      .sort((a, b) => a[1].accessedAt - b[1].accessedAt);

    const toEvict = entries.length - this._maxNodes;
    for (let i = 0; i < toEvict; i++) {
      this._nodes.delete(entries[i][0]);
    }
  }

  _evictLinksIfNeeded() {
    if (this._links.size <= this._maxLinks) return;

    // Sort by accessedAt ascending (oldest first) and evict
    const entries = [...this._links.entries()]
      .sort((a, b) => a[1].accessedAt - b[1].accessedAt);

    const toEvict = entries.length - this._maxLinks;
    for (let i = 0; i < toEvict; i++) {
      this._links.delete(entries[i][0]);
    }
  }

  get nodeCount() {
    return this._nodes.size;
  }

  get linkCount() {
    return this._links.size;
  }
}
