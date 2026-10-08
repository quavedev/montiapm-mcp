import type { MontiAppConfig, MontiMcpServerOptions } from './server.js';

/**
 * Read server options from the environment.
 *
 * MONTI_APPS (JSON array of { name, appId, appSecret, region? }) enables
 * multi-app mode and takes precedence. Otherwise MONTI_APP_ID,
 * MONTI_APP_SECRET and optional MONTI_REGION configure a single app.
 */
export function readServerOptionsFromEnv(env: NodeJS.ProcessEnv): MontiMcpServerOptions {
  const rawApps = env.MONTI_APPS?.trim();
  if (rawApps) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawApps);
    } catch {
      throw new Error('MONTI_APPS must be a JSON array of { name, appId, appSecret, region? }');
    }
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('MONTI_APPS must be a non-empty JSON array');
    }
    const apps: MontiAppConfig[] = parsed.map((item, index) => {
      const app = (item ?? {}) as Record<string, unknown>;
      if (typeof app.name !== 'string' || typeof app.appId !== 'string' || typeof app.appSecret !== 'string') {
        throw new Error(`MONTI_APPS[${index}] needs string name, appId and appSecret`);
      }
      return {
        name: app.name,
        appId: app.appId,
        appSecret: app.appSecret,
        ...(typeof app.region === 'string' && app.region ? { region: app.region } : {}),
      };
    });
    return { apps };
  }

  if (!env.MONTI_APP_ID || !env.MONTI_APP_SECRET) {
    throw new Error('MONTI_APP_ID and MONTI_APP_SECRET environment variables are required (or set MONTI_APPS)');
  }
  return { appId: env.MONTI_APP_ID, appSecret: env.MONTI_APP_SECRET, region: env.MONTI_REGION };
}
