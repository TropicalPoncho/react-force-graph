import * as React from 'react';

export interface GraphData<NodeType = {}, LinkType = {}> {
  nodes: NodeType[];
  links: LinkType[];
}

export interface FetchParams {
  filters?: Record<string, any>;
  nodeIds?: (string | number)[];
  cursor?: string | number;
  offset?: number;
  limit?: number;
}

export interface CacheOptions {
  maxAge?: number;
  maxNodes?: number;
  maxLinks?: number;
  nodeIdField?: string;
  linkIdField?: string | ((link: any) => string);
}

export interface GraphDataLoaderConfig<NodeType = {}, LinkType = {}> {
  url: string | ((params: FetchParams) => string);
  method?: 'GET' | 'POST';
  headers?: Record<string, string> | (() => Record<string, string>);
  buildRequest?: (params: FetchParams) => RequestInit;
  parseResponse?: (response: any) => GraphData<NodeType, LinkType>;
  filters?: Record<string, any>;
  buildFilterParams?: (filters: Record<string, any>) => Record<string, string> | object;
  lazyLoad?: boolean;
  expandOnNodeClick?: boolean;
  fetchNeighbors?: (nodeId: string | number) => Promise<GraphData<NodeType, LinkType>>;
  pollInterval?: number;
  cacheOptions?: CacheOptions;
  onLoadStart?: () => void;
  onLoadComplete?: (data: GraphData<NodeType, LinkType>) => void;
  onLoadError?: (error: Error) => void;
  onDataMerge?: (existing: GraphData<NodeType, LinkType>, incoming: GraphData<NodeType, LinkType>) => GraphData<NodeType, LinkType>;
}

export interface GraphDataLoaderMethods<NodeType = {}, LinkType = {}> {
  loadNeighbors(nodeId: string | number): Promise<void>;
  loadMore(params: FetchParams): Promise<void>;
  clearCache(): void;
  getLoadedData(): GraphData<NodeType, LinkType>;
  isLoading(): boolean;
  getError(): Error | null;
}

export interface WithLoaderProps<NodeType = {}, LinkType = {}> {
  dataLoader?: GraphDataLoaderConfig<NodeType, LinkType>;
}

export default function withGraphDataLoader<P extends object, RefType extends object>(
  WrappedComponent: React.ComponentType<P>
): React.ForwardRefExoticComponent<
  React.PropsWithoutRef<P & WithLoaderProps> &
  React.RefAttributes<RefType & GraphDataLoaderMethods>
>;
