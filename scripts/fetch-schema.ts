import { getIntrospectionQuery } from 'graphql';
import fetch from 'cross-fetch';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const appId = process.env.MONTI_APP_ID;
  const appSecret = process.env.MONTI_APP_SECRET;

  if (!appId || !appSecret) {
    console.error('MONTI_APP_ID and MONTI_APP_SECRET are required');
    process.exit(1);
  }

  console.log('Authenticating...');
  const authResponse = await fetch('https://api.montiapm.com/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appId, appSecret }),
  });

  const token = await authResponse.text();

  if (!token) {
    console.error('No token received');
    process.exit(1);
  }

  console.log('Fetching schema...');
  const introspectionResponse = await fetch('https://api.montiapm.com/core', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  });

  const result = await introspectionResponse.json();

  if (!result.data) {
    console.error('No introspection data received:', result);
    process.exit(1);
  }

  const schemaPath = resolve(process.cwd(), 'schema.json');
  writeFileSync(schemaPath, JSON.stringify(result, null, 2));
  console.log(`Schema saved to ${schemaPath}`);
}

main().catch(console.error);
