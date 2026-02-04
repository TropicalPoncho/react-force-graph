export interface CacheOptions {
  maxAge?: number;
  maxNodes?: number;
  maxLinks?: number;
  nodeIdField?: string;
  linkIdField?: string | ((link: any) => string);
}

export interface CacheGraphData<NodeType = {}, LinkType = {}> {
  nodes: NodeType[];
  links: LinkType[];
}

export default class GraphDataCache<NodeType = {}, LinkType = {}> {
  constructor(options?: CacheOptions);

  hasNode(id: string | number): boolean;
  addNodes(nodes: NodeType[]): void;

  hasLink(source: string | number, target: string | number): boolean;
  addLinks(links: LinkType[]): void;

  hasNeighborsFetched(nodeId: string | number): boolean;
  markNeighborsFetched(nodeId: string | number): void;

  hasRequest(serializedParams: string): boolean;
  isStaleRequest(serializedParams: string): boolean;
  markRequest(serializedParams: string): void;

  merge(graphData: CacheGraphData<NodeType, LinkType>): void;
  toGraphData(): CacheGraphData<NodeType, LinkType>;

  clear(): void;

  readonly nodeCount: number;
  readonly linkCount: number;
}
