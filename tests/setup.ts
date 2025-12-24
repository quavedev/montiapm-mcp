import { beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';

// Create MSW server instance - handlers will be added per test
export const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
