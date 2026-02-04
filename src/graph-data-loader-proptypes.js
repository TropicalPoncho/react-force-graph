import PropTypes from 'prop-types';

export const GraphDataLoaderPropTypes = {
  dataLoader: PropTypes.shape({
    url: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    method: PropTypes.oneOf(['GET', 'POST']),
    headers: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    buildRequest: PropTypes.func,
    parseResponse: PropTypes.func,
    filters: PropTypes.object,
    buildFilterParams: PropTypes.func,
    lazyLoad: PropTypes.bool,
    expandOnNodeClick: PropTypes.bool,
    fetchNeighbors: PropTypes.func,
    pollInterval: PropTypes.number,
    cacheOptions: PropTypes.shape({
      maxAge: PropTypes.number,
      maxNodes: PropTypes.number,
      maxLinks: PropTypes.number,
      nodeIdField: PropTypes.string,
      linkIdField: PropTypes.oneOfType([PropTypes.string, PropTypes.func])
    }),
    onLoadStart: PropTypes.func,
    onLoadComplete: PropTypes.func,
    onLoadError: PropTypes.func,
    onDataMerge: PropTypes.func
  })
};
