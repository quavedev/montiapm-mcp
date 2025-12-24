import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { gql } from '@apollo/client/core';
import { server } from '../setup.js';
import { createGraphQLClient } from '../../src/graphql/client.js';

const GRAPHQL_ENDPOINT = 'https://api.montiapm.com/core';

describe('GraphQL Client', () => {
  let getToken: () => Promise<string>;

  beforeEach(() => {
    getToken = async () => 'test-jwt-token';
  });

  describe('query execution', () => {
    it('should execute queries with auth token in header', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, async ({ request }) => {
          const authHeader = request.headers.get('authorization');
          expect(authHeader).toBe('test-jwt-token');

          return HttpResponse.json({
            data: {
              meteorMethodTraces: [
                { id: '1', method: 'testMethod', totalValue: 100 },
              ],
            },
          });
        }),
      );

      const client = createGraphQLClient(getToken);

      const result = await client.query({
        query: gql`
          query TestQuery {
            meteorMethodTraces {
              id
              method
              totalValue
            }
          }
        `,
      });

      expect(result.data.meteorMethodTraces).toHaveLength(1);
      expect(result.data.meteorMethodTraces[0].method).toBe('testMethod');
    });

    it('should handle GraphQL errors', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, () => {
          return HttpResponse.json({
            errors: [
              {
                message: 'Field not found',
                locations: [{ line: 1, column: 1 }],
                path: ['invalidField'],
              },
            ],
          });
        }),
      );

      const client = createGraphQLClient(getToken);

      const result = await client.query({
        query: gql`
          query InvalidQuery {
            invalidField
          }
        `,
        errorPolicy: 'all',
      });

      expect(result.errors).toBeDefined();
      expect(result.errors?.[0].message).toBe('Field not found');
    });

    it('should handle rate limiting (429)', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, () => {
          return HttpResponse.json(
            { error: 'Rate limit exceeded' },
            { status: 429 },
          );
        }),
      );

      const client = createGraphQLClient(getToken);

      await expect(
        client.query({
          query: gql`
            query RateLimitedQuery {
              meteorMethodTraces {
                id
              }
            }
          `,
        }),
      ).rejects.toThrow();
    });

    it('should handle auth errors (401)', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, () => {
          return HttpResponse.json(
            { error: 'Unauthorized' },
            { status: 401 },
          );
        }),
      );

      const client = createGraphQLClient(getToken);

      await expect(
        client.query({
          query: gql`
            query UnauthorizedQuery {
              meteorMethodTraces {
                id
              }
            }
          `,
        }),
      ).rejects.toThrow();
    });

    it('should handle other network errors (500)', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
          );
        }),
      );

      const client = createGraphQLClient(getToken);

      await expect(
        client.query({
          query: gql`
            query ServerErrorQuery {
              meteorMethodTraces {
                id
              }
            }
          `,
        }),
      ).rejects.toThrow();
    });

    it('should handle network failures', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, () => {
          return HttpResponse.error();
        }),
      );

      const client = createGraphQLClient(getToken);

      await expect(
        client.query({
          query: gql`
            query NetworkFailQuery {
              meteorMethodTraces {
                id
              }
            }
          `,
        }),
      ).rejects.toThrow();
    });

    it('should handle token fetch error', async () => {
      getToken = async () => {
        throw new Error('Token fetch failed');
      };

      const client = createGraphQLClient(getToken);

      await expect(
        client.query({
          query: gql`
            query TokenErrorQuery {
              meteorMethodTraces {
                id
              }
            }
          `,
        }),
      ).rejects.toThrow('Token fetch failed');
    });

    it('should properly pass query variables', async () => {
      server.use(
        http.post(GRAPHQL_ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            variables?: { limit: number; startTime: number };
          };
          expect(body.variables).toEqual({
            limit: 10,
            startTime: 1234567890,
          });

          return HttpResponse.json({
            data: {
              meteorMethodTraces: [],
            },
          });
        }),
      );

      const client = createGraphQLClient(getToken);

      await client.query({
        query: gql`
          query TestQueryWithVars($limit: Int, $startTime: Float) {
            meteorMethodTraces(limit: $limit, startTime: $startTime) {
              id
            }
          }
        `,
        variables: {
          limit: 10,
          startTime: 1234567890,
        },
      });
    });
  });

  describe('token refresh', () => {
    it('should use fresh token from getToken function', async () => {
      let callCount = 0;
      getToken = async () => {
        callCount++;
        return `token-${callCount}`;
      };

      server.use(
        http.post(GRAPHQL_ENDPOINT, async ({ request }) => {
          const authHeader = request.headers.get('authorization');
          // Each request should get fresh token
          expect(authHeader).toMatch(/^token-\d+$/);
          return HttpResponse.json({ data: { meteorMethodTraces: [] } });
        }),
      );

      const client = createGraphQLClient(getToken);

      // Make two requests - each should call getToken
      await client.query({
        query: gql`
          query Q1 {
            meteorMethodTraces {
              id
            }
          }
        `,
        fetchPolicy: 'no-cache',
      });

      await client.query({
        query: gql`
          query Q2 {
            meteorMethodTraces {
              id
            }
          }
        `,
        fetchPolicy: 'no-cache',
      });

      expect(callCount).toBe(2);
    });
  });
});
