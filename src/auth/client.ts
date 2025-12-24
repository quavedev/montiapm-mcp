import fetch from 'cross-fetch';
import { AuthClientOptions, AuthenticationError } from './types.js';

const DEFAULT_AUTH_ENDPOINT = 'https://api.montiapm.com/auth';

export class AuthClient {
  private readonly appId: string;
  private readonly appSecret: string;
  private readonly authEndpoint: string;
  private cachedToken: string | null = null;

  constructor(options: AuthClientOptions) {
    this.appId = options.credentials.appId;
    this.appSecret = options.credentials.appSecret;
    this.authEndpoint = options.authEndpoint ?? DEFAULT_AUTH_ENDPOINT;
  }

  async getToken(): Promise<string> {
    if (this.cachedToken) {
      return this.cachedToken;
    }

    return this.authenticate();
  }

  invalidateToken(): void {
    this.cachedToken = null;
  }

  private async authenticate(): Promise<string> {
    let response: Response;

    try {
      response = await fetch(this.authEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId: this.appId,
          appSecret: this.appSecret,
        }),
      });
    } catch (error) {
      throw new AuthenticationError(
        `Network error during authentication: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    if (!response.ok) {
      let errorMessage = 'Authentication failed';
      try {
        const errorBody = (await response.json()) as { error?: string };
        if (errorBody.error) {
          errorMessage = errorBody.error;
        }
      } catch {
        // Ignore JSON parse errors
      }
      throw new AuthenticationError(errorMessage, response.status);
    }

    // The API returns the JWT token directly as text, not JSON
    const token = await response.text();

    if (!token) {
      throw new AuthenticationError('Invalid response: missing token');
    }

    this.cachedToken = token;
    return token;
  }
}
