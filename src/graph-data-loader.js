import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import GraphDataCache from './graph-data-cache.js';
import { GraphDataLoaderPropTypes } from './graph-data-loader-proptypes.js';

function appendQueryParams(baseUrl, filters, buildFilterParams, extraParams) {
  const filterParams = buildFilterParams ? buildFilterParams(filters || {}) : (filters || {});
  const allParams = { ...filterParams };
  if (extraParams.nodeIds) allParams.nodeIds = extraParams.nodeIds.join(',');
  if (extraParams.cursor != null) allParams.cursor = extraParams.cursor;
  if (extraParams.offset != null) allParams.offset = extraParams.offset;
  if (extraParams.limit != null) allParams.limit = extraParams.limit;

  const qs = new URLSearchParams(allParams).toString();
  if (!qs) return baseUrl;
  return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${qs}`;
}

function buildDefaultRequest(method, headers, filters, buildFilterParams, extraParams) {
  const resolvedHeaders = typeof headers === 'function' ? headers() : (headers || {});
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...resolvedHeaders }
  };
  if (method === 'POST') {
    const filterParams = buildFilterParams ? buildFilterParams(filters || {}) : (filters || {});
    options.body = JSON.stringify({ ...filterParams, ...extraParams });
  }
  return options;
}

export default function withGraphDataLoader(WrappedComponent) {
  const WithLoader = forwardRef(function WithGraphDataLoader(props, outerRef) {
    const { dataLoader, graphData: directGraphData, onNodeClick: userOnNodeClick, ...restProps } = props;

    // If no dataLoader config, pass through directly (backwards compatible)
    if (!dataLoader) {
      return <WrappedComponent ref={outerRef} graphData={directGraphData} onNodeClick={userOnNodeClick} {...restProps} />;
    }

    const {
      url,
      method = 'GET',
      headers,
      buildRequest,
      parseResponse,
      filters,
      buildFilterParams,
      expandOnNodeClick = false,
      fetchNeighbors,
      pollInterval = 0,
      cacheOptions = {},
      onLoadStart,
      onLoadComplete,
      onLoadError,
      onDataMerge
    } = dataLoader;

    const cacheRef = useRef(null);
    if (!cacheRef.current) {
      cacheRef.current = new GraphDataCache(cacheOptions);
    }

    const [loadedData, setLoadedData] = useState({ nodes: [], links: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const innerRef = useRef();
    const abortRef = useRef(null);

    // Serialize filters for dependency tracking
    const filterKey = useMemo(() => JSON.stringify(filters || {}), [filters]);
    const prevFilterKeyRef = useRef(filterKey);

    // Clear cache when filters change
    useEffect(() => {
      if (prevFilterKeyRef.current !== filterKey) {
        cacheRef.current.clear();
        prevFilterKeyRef.current = filterKey;
      }
    }, [filterKey]);

    // Core fetch function
    const fetchData = useCallback(async (extraParams = {}) => {
      const serializedParams = JSON.stringify({ url, filters, ...extraParams });

      // Check cache first
      if (cacheRef.current.hasRequest(serializedParams) && !cacheRef.current.isStaleRequest(serializedParams)) {
        return;
      }

      // Abort previous in-flight request
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      if (onLoadStart) onLoadStart();

      try {
        const resolvedUrl = typeof url === 'function' ? url({ filters, ...extraParams }) : url;

        let fetchOptions;
        if (buildRequest) {
          fetchOptions = buildRequest({ filters, ...extraParams });
        } else {
          fetchOptions = buildDefaultRequest(method, headers, filters, buildFilterParams, extraParams);
        }

        fetchOptions.signal = controller.signal;

        const finalUrl = method === 'GET'
          ? appendQueryParams(resolvedUrl, filters, buildFilterParams, extraParams)
          : resolvedUrl;

        const response = await fetch(finalUrl, fetchOptions);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);

        const rawData = await response.json();
        const parsed = parseResponse ? parseResponse(rawData) : rawData;

        // Apply custom merge or default union merge
        if (onDataMerge) {
          const merged = onDataMerge(cacheRef.current.toGraphData(), parsed);
          cacheRef.current.clear();
          cacheRef.current.merge(merged);
        } else {
          cacheRef.current.merge(parsed);
        }

        cacheRef.current.markRequest(serializedParams);

        const newGraphData = cacheRef.current.toGraphData();
        setLoadedData(newGraphData);
        setError(null);
        if (onLoadComplete) onLoadComplete(newGraphData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err);
          if (onLoadError) onLoadError(err);
        }
      } finally {
        setLoading(false);
      }
    }, [url, method, headers, buildRequest, parseResponse, filterKey, buildFilterParams, onLoadStart, onLoadComplete, onLoadError, onDataMerge]);

    // Initial fetch + re-fetch on filter change
    useEffect(() => {
      fetchData();
    }, [fetchData]);

    // Polling
    useEffect(() => {
      if (!pollInterval || pollInterval <= 0) return;
      const interval = setInterval(() => {
        // Clear request cache for current params to force re-fetch during polling
        cacheRef.current._requests.clear();
        fetchData();
      }, pollInterval);
      return () => clearInterval(interval);
    }, [fetchData, pollInterval]);

    // Cleanup abort on unmount
    useEffect(() => {
      return () => { if (abortRef.current) abortRef.current.abort(); };
    }, []);

    // Lazy load: intercept onNodeClick
    const handleNodeClick = useCallback((node, event) => {
      if (expandOnNodeClick && node) {
        const nodeId = node[cacheOptions.nodeIdField || 'id'];
        if (nodeId != null && !cacheRef.current.hasNeighborsFetched(nodeId)) {
          if (fetchNeighbors) {
            fetchNeighbors(nodeId).then(neighborData => {
              cacheRef.current.merge(neighborData);
              cacheRef.current.markNeighborsFetched(nodeId);
              setLoadedData(cacheRef.current.toGraphData());
            }).catch(err => { if (onLoadError) onLoadError(err); });
          } else {
            fetchData({ nodeIds: [nodeId] }).then(() => {
              cacheRef.current.markNeighborsFetched(nodeId);
            });
          }
        }
      }
      if (userOnNodeClick) userOnNodeClick(node, event);
    }, [expandOnNodeClick, fetchNeighbors, fetchData, userOnNodeClick, cacheOptions.nodeIdField, onLoadError]);

    // Expose additional loader methods via ref
    useImperativeHandle(outerRef, () => {
      const target = {};

      return new Proxy(target, {
        get(_, prop) {
          // Loader-specific methods
          if (prop === 'loadNeighbors') {
            return (nodeId) => {
              if (fetchNeighbors) {
                return fetchNeighbors(nodeId).then(data => {
                  cacheRef.current.merge(data);
                  cacheRef.current.markNeighborsFetched(nodeId);
                  setLoadedData(cacheRef.current.toGraphData());
                });
              }
              return fetchData({ nodeIds: [nodeId] });
            };
          }
          if (prop === 'loadMore') return (params) => fetchData(params);
          if (prop === 'clearCache') return () => {
            cacheRef.current.clear();
            setLoadedData({ nodes: [], links: [] });
          };
          if (prop === 'getLoadedData') return () => cacheRef.current.toGraphData();
          if (prop === 'isLoading') return () => loading;
          if (prop === 'getError') return () => error;

          // Delegate to inner graph ref
          if (innerRef.current && prop in innerRef.current) {
            const val = innerRef.current[prop];
            return typeof val === 'function' ? val.bind(innerRef.current) : val;
          }
          return undefined;
        }
      });
    }, [fetchData, fetchNeighbors, loading, error]);

    // Determine final graphData: directGraphData takes precedence (backwards compat)
    const finalGraphData = directGraphData || loadedData;

    return (
      <WrappedComponent
        ref={innerRef}
        graphData={finalGraphData}
        onNodeClick={handleNodeClick}
        {...restProps}
      />
    );
  });

  WithLoader.displayName = `WithGraphDataLoader(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  WithLoader.propTypes = {
    ...WrappedComponent.propTypes,
    ...GraphDataLoaderPropTypes
  };

  return WithLoader;
}
