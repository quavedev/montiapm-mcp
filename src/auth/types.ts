export interface AuthCredentials {
  appId: string;
  appSecret: string;
}

export interface AuthResponse {
  token: string;
}

export interface AuthClientOptions {
  credentials: AuthCredentials;
  authEndpoint?: string;
}

export class AuthenticationError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}
