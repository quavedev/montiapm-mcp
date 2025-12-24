/**
 * Sort order constants matching the GraphQL SortOrderEnum
 */
export const SortOrder = {
  ASC: 'ASC',
  DSC: 'DSC',
} as const;

export type SortOrderType = (typeof SortOrder)[keyof typeof SortOrder];
