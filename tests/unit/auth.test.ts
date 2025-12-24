import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../setup.js';
import { AuthClient } from '../../src/auth/client.js';
import { AuthenticationError } from '../../src/auth/types.js';

const AUTH_ENDPOINT = 'https://api.montiapm.com/auth';

describe('AuthClient', () => {
  let authClient: AuthClient;

  beforeEach(() => {
    authClient = new AuthClient({
      credentials: {
        appId: 'test-app-id',
        appSecret: 'test-app-secret',
      },
    });
  });

  describe('authenticate', () => {
    it('should authenticate with valid credentials', async () => {
      server.use(
        http.post(AUTH_ENDPOINT, async ({ request }) => {
          const body = (await request.json()) as {
            appId: string;
            appSecret: string;
          };
          expect(body.appId).toBe('test-app-id');
          expect(body.appSecret).toBe('test-app-secret');
          // API returns JWT token directly as text
          return HttpResponse.text('jwt-token-123');
        }),
      );

      const token = await authClient.getToken();
      expect(token).toBe('jwt-token-123');
    });

    it('should throw AuthenticationError with invalid credentials', async () => {
      server.use(
        http.post(AUTH_ENDPOINT, () => {
          return HttpResponse.json(
            { error: 'Invalid credentials' },
            { status: 401 },
          );
        }),
      );

      await expect(authClient.getToken()).rejects.toThrow(AuthenticationError);
      await expect(authClient.getToken()).rejects.toThrow('Invalid credentials');
    });

    it('should throw AuthenticationError on network error', async () => {
      server.use(
        http.post(AUTH_ENDPOINT, () => {
          return HttpResponse.error();
        }),
      );

      await expect(authClient.getToken()).rejects.toThrow(AuthenticationError);
    });

    it('should cache token and reuse until expired', async () => {
      let callCount = 0;
      server.use(
        http.post(AUTH_ENDPOINT, () => {
          callCount++;
          return HttpResponse.text(`jwt-token-${callCount}`);
        }),
      );

      // First call should fetch token
      const token1 = await authClient.getToken();
      expect(token1).toBe('jwt-token-1');
      expect(callCount).toBe(1);

      // Second call should use cached token
      const token2 = await authClient.getToken();
      expect(token2).toBe('jwt-token-1');
      expect(callCount).toBe(1); // No additional call
    });

    it('should refresh token when expired', async () => {
      let callCount = 0;
      server.use(
        http.post(AUTH_ENDPOINT, () => {
          callCount++;
          return HttpResponse.text(`jwt-token-${callCount}`);
        }),
      );

      // Get initial token
      const token1 = await authClient.getToken();
      expect(token1).toBe('jwt-token-1');

      // Force token expiration
      authClient.invalidateToken();

      // Should fetch new token
      const token2 = await authClient.getToken();
      expect(token2).toBe('jwt-token-2');
      expect(callCount).toBe(2);
    });

    it('should handle server error responses', async () => {
      server.use(
        http.post(AUTH_ENDPOINT, () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
          );
        }),
      );

      await expect(authClient.getToken()).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError when token is empty', async () => {
      server.use(
        http.post(AUTH_ENDPOINT, () => {
          return HttpResponse.text('');
        }),
      );

      await expect(authClient.getToken()).rejects.toThrow(AuthenticationError);
      await expect(authClient.getToken()).rejects.toThrow('missing token');
    });

    it('should handle non-JSON error responses gracefully', async () => {
      server.use(
        http.post(AUTH_ENDPOINT, () => {
          return new HttpResponse('Server Error', { status: 500 });
        }),
      );

      await expect(authClient.getToken()).rejects.toThrow(AuthenticationError);
    });
  });

  describe('with custom endpoint', () => {
    it('should use custom auth endpoint', async () => {
      const customEndpoint = 'https://custom.api.com/auth';
      const customClient = new AuthClient({
        credentials: {
          appId: 'custom-app-id',
          appSecret: 'custom-app-secret',
        },
        authEndpoint: customEndpoint,
      });

      server.use(
        http.post(customEndpoint, () => {
          return HttpResponse.text('custom-token');
        }),
      );

      const token = await customClient.getToken();
      expect(token).toBe('custom-token');
    });
  });
});
