import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSubscriptionTraces } from '../../../src/tools/subscription-traces.js';
import type { MontiGraphQLClient } from '../../../src/graphql/client.js';

describe('getSubscriptionTraces', () => {
  const mockQuery = vi.fn();
  const mockClient = { query: mockQuery } as unknown as MontiGraphQLClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return subscription traces', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorPubTraces: [
          {
            id: 'pub-1',
            publication: 'userProfile',
            host: 'server-1',
            time: Date.now(),
            totalValue: 50,
            metrics: {
              total: 50,
              wait: 5,
              db: 40,
              compute: 5,
            },
          },
        ],
      },
    });

    const result = await getSubscriptionTraces(mockClient, {});

    expect(result.count).toBe(1);
    expect(result.traces[0].publication).toBe('userProfile');
  });

  it('should handle empty traces', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorPubTraces: [],
      },
    });

    const result = await getSubscriptionTraces(mockClient, {});

    expect(result.count).toBe(0);
    expect(result.traces).toHaveLength(0);
  });

  it('should filter by publication name', async () => {
    mockQuery.mockResolvedValueOnce({
      data: {
        meteorPubTraces: [
          {
            id: 'pub-1',
            publication: 'userProfile',
            host: 'server-1',
            time: Date.now(),
            totalValue: 50,
            metrics: { total: 50, wait: 5, db: 40, compute: 5 },
          },
        ],
      },
    });

    await getSubscriptionTraces(mockClient, { publication: 'userProfile' });

    expect(mockQuery).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: expect.objectContaining({
        publication: 'userProfile',
      }),
    });
  });
});
