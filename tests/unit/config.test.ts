import { describe, it, expect } from 'vitest';
import { readServerOptionsFromEnv } from '../../src/config.js';
import { resolveApps } from '../../src/server.js';

describe('readServerOptionsFromEnv', () => {
  it('uses single-app env vars', () => {
    expect(readServerOptionsFromEnv({ MONTI_APP_ID: 'id', MONTI_APP_SECRET: 's', MONTI_REGION: 'eu' })).toEqual({
      appId: 'id',
      appSecret: 's',
      region: 'eu',
    });
  });

  it('prefers MONTI_APPS', () => {
    const options = readServerOptionsFromEnv({
      MONTI_APP_ID: 'ignored',
      MONTI_APP_SECRET: 'ignored',
      MONTI_APPS: JSON.stringify([
        { name: 'api', appId: 'a', appSecret: 'x' },
        { name: 'jobs', appId: 'b', appSecret: 'y', region: 'eu' },
      ]),
    });
    expect(options).toEqual({
      apps: [
        { name: 'api', appId: 'a', appSecret: 'x' },
        { name: 'jobs', appId: 'b', appSecret: 'y', region: 'eu' },
      ],
    });
  });

  it('rejects invalid configuration', () => {
    expect(() => readServerOptionsFromEnv({})).toThrow(/MONTI_APP_ID/);
    expect(() => readServerOptionsFromEnv({ MONTI_APPS: 'not json' })).toThrow(/JSON array/);
    expect(() => readServerOptionsFromEnv({ MONTI_APPS: '[]' })).toThrow(/non-empty/);
    expect(() => readServerOptionsFromEnv({ MONTI_APPS: '[{"name":"a"}]' })).toThrow(/MONTI_APPS\[0\]/);
  });
});

describe('resolveApps', () => {
  it('wraps single-app options as the default app', () => {
    expect(resolveApps({ appId: 'id', appSecret: 's' })).toEqual([
      { name: 'default', appId: 'id', appSecret: 's', region: undefined },
    ]);
  });

  it('rejects duplicate app names', () => {
    expect(() =>
      resolveApps({
        apps: [
          { name: 'a', appId: '1', appSecret: 'x' },
          { name: 'a', appId: '2', appSecret: 'y' },
        ],
      }),
    ).toThrow(/Duplicate/);
  });
});
