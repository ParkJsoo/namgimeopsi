import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import ts from 'typescript';
import { corsHeaders } from '@supabase/supabase-js/cors';

const code = ts.transpileModule(readFileSync(new URL('./index.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness(options = {}) {
  let handler;
  const calls = { env: 0, auth: 0, admin: 0, updates: [] };
  const scan = { id: 'scan', user_id: 'user', storage_path: 'user/receipt.png', mime_type: 'image/png', byte_size: 70, status: options.status ?? 'uploaded' };
  const client = {
    auth: { getUser: async () => {
      calls.auth++;
      if (options.throwAuth) throw new Error('private failure details');
      return { data: { user: options.invalidAuth ? null : { id: 'user' } } };
    } },
    from: () => {
      const query = {
        select: () => query,
        eq: () => query,
        maybeSingle: async () => ({ data: options.missingScan ? null : scan, error: options.lookupError }),
      };
      return query;
    },
  };
  const admin = {
    from: () => {
      const query = {
        update: (value) => { calls.updates.push(value); return query; },
        eq: () => query,
        then: (resolve) => resolve({ error: null }),
      };
      return query;
    },
    storage: { from: () => ({ list: async () => ({ data: [{ name: 'receipt.png', metadata: { mimetype: 'image/png', size: 70 } }] }) }) },
  };
  vm.runInNewContext(code, {
    exports: {}, Request, Response,
    Deno: {
      serve: (callback) => { handler = callback; },
      env: { get: (name) => { calls.env++; return options.unconfigured ? undefined : name; } },
    },
    require: (name) => {
      if (name.endsWith('/cors')) return { corsHeaders };
      assert.match(name, /^https:\/\/esm.sh\/@supabase\/supabase-js@/);
      return { createClient: (_url, key) => { if (key === 'SUPABASE_SERVICE_ROLE_KEY') { calls.admin++; return admin; } return client; } };
    },
  });
  return { handler, calls };
}
function assertCors(response) {
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*');
  const methods = response.headers.get('Access-Control-Allow-Methods').toUpperCase();
  assert.ok(methods.includes('POST') && methods.includes('OPTIONS'));
  const headers = response.headers.get('Access-Control-Allow-Headers').toLowerCase().split(',').map((header) => header.trim());
  for (const name of ['authorization', 'apikey', 'content-type', 'x-client-info', 'x-retry-count', 'traceparent', 'tracestate', 'baggage']) assert.ok(headers.includes(name), name);
}
test('unauthenticated preflight succeeds without environment, auth or data access', async () => {
  const { handler, calls } = harness({ unconfigured: true });
  const response = await handler(new Request('https://local.test/analyze-receipt', {
    method: 'OPTIONS', headers: { Origin: 'http://localhost:8081', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'authorization,apikey,content-type,x-client-info' },
  }));
  assert.equal(response.status, 204);
  assertCors(response);
  assert.deepEqual(calls, { env: 0, auth: 0, admin: 0, updates: [] });
});
for (const [label, options, status] of [
  ['new fixture analysis', {}, 200], ['ready scan', { status: 'ready' }, 200],
  ['method rejected', { method: 'GET' }, 405], ['missing server config', { unconfigured: true }, 500],
  ['missing authorization', { noAuth: true }, 401], ['invalid authorization', { invalidAuth: true }, 401],
  ['malformed body', { body: '{' }, 400], ['missing scan ID', { body: '{}' }, 400],
  ['scan missing', { missingScan: true }, 404], ['scan conflict', { status: 'analyzing' }, 409],
  ['lookup failure', { lookupError: {} }, 500], ['unexpected failure', { throwAuth: true }, 500],
]) {
  test(`${label} returns CORS headers and keeps authentication/fixture behavior`, async () => {
    const { handler, calls } = harness(options);
    const response = await handler(new Request('https://local.test/analyze-receipt', {
      method: options.method ?? 'POST',
      headers: { Origin: 'http://localhost:8081', ...(options.noAuth ? {} : { Authorization: 'Bearer test' }), 'Content-Type': 'application/json' },
      ...(options.method ? {} : { body: options.body ?? '{"scanId":"scan"}' }),
    }));
    assert.equal(response.status, status);
    assertCors(response);
    const body = await response.json();
    if (status === 200) assert.deepEqual(body, { id: 'scan', status: 'ready', analysisSource: 'fixture' });
    else assert.ok(body.error);
    assert.ok(!JSON.stringify(body).includes('private failure'));
    if (label === 'new fixture analysis') assert.equal(calls.updates.at(-1).result.provider, 'fixture');
    if (status === 401) assert.equal(calls.admin, 0);
  });
}
