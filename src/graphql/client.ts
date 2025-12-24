import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
  Observable,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import fetch from 'cross-fetch';

const GRAPHQL_ENDPOINT = 'https://api.montiapm.com/core';

export function createGraphQLClient(
  getToken: () => Promise<string>,
  endpoint: string = GRAPHQL_ENDPOINT,
) {
  const httpLink = new HttpLink({
    uri: endpoint,
    fetch,
  });

  // Auth link that injects JWT token for each request
  const authLink = new ApolloLink((operation, forward) => {
    return new Observable((observer) => {
      getToken()
        .then((token) => {
          operation.setContext(
            ({
              headers = {},
            }: {
              headers?: Record<string, string>;
            }) => ({
              headers: {
                ...headers,
                authorization: token,
              },
            }),
          );
          const subscription = forward(operation).subscribe({
            next: observer.next.bind(observer),
            error: observer.error.bind(observer),
            complete: observer.complete.bind(observer),
          });
          return () => subscription.unsubscribe();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  });

  // Error handling link
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path, extensions }) => {
        console.error(
          `[GraphQL Error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`,
          extensions,
        );
      });
    }
    if (networkError) {
      if ('statusCode' in networkError) {
        const statusCode = (networkError as { statusCode: number }).statusCode;
        if (statusCode === 401) {
          console.error('[Auth Error]: Token expired or invalid');
        } else if (statusCode === 429) {
          console.error('[Rate Limit]: Too many requests');
        } else {
          console.error(`[Network Error]: Status ${statusCode}`);
        }
      } else {
        console.error(`[Network Error]: ${networkError.message}`);
      }
    }
  });

  return new ApolloClient({
    link: ApolloLink.from([errorLink, authLink, httpLink]),
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'no-cache', // Always fetch fresh data for APM
        errorPolicy: 'none',
      },
      watchQuery: {
        fetchPolicy: 'no-cache',
        errorPolicy: 'none',
      },
    },
  });
}

export type MontiGraphQLClient = ReturnType<typeof createGraphQLClient>;
