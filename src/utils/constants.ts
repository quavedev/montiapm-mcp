/**
 * Sort order constants matching the GraphQL SortOrderEnum
 */
export const SortOrder = {
  ASC: 'ASC',
  DSC: 'DSC',
} as const;

export type SortOrderType = (typeof SortOrder)[keyof typeof SortOrder];

/**
 * Monti keeps a trace only for a sampled request, so trace queries can be
 * empty while aggregated metrics still have data.
 */
export const NO_TRACES_NOTE =
  'No traces were sampled for this filter and window (Monti stores only sampled traces, and some plans keep none). Aggregated data is still available: use get_http_breakdown, get_method_breakdown, get_pub_breakdown, or get_http_metrics.';
