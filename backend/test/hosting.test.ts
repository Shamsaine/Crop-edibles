import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { frontendDist, serveFrontend } from '../src/frontend.js';

test('one origin serves the built React app and preserves API and asset responses', async () => {
  const html = await readFile(path.join(frontendDist, 'index.html'), 'utf8');
  const app = express();
  app.get('/api/health', (_req,res) => res.json({status:'ok'}));
  app.use('/api', (_req,res) => res.status(404).json({error:'Endpoint not found.'}));
  serveFrontend(app);
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  try {
    for (const route of ['/', '/orders', '/admin', '/shop']) {
      const response = await fetch(base+route, {headers:{Accept:'text/html'}});
      assert.equal(response.status,200); assert.match(response.headers.get('content-type') || '', /text\/html/);
      assert.equal(await response.text(),html);
    }
    const asset = html.match(/src="([^"]+\.js)"/); assert.ok(asset);
    const javascript = await fetch(base+asset[1]); assert.equal(javascript.status,200);
    assert.match(javascript.headers.get('content-type') || '', /javascript/);
    const logo = await fetch(base+'/crop-edibles-logo.png'); assert.equal(logo.status,200);
    assert.match(logo.headers.get('content-type') || '', /image\/png/);
    const health = await fetch(base+'/api/health'); assert.deepEqual(await health.json(), {status:'ok'});
    for (const route of ['/api', '/api/not-a-route']) {
      const response=await fetch(base+route); assert.equal(response.status,404);
      assert.deepEqual(await response.json(),{error:'Endpoint not found.'});
    }
    for (const route of ['/assets/missing.js','/assets/missing','/missing.png']) assert.equal((await fetch(base+route)).status,404);
    assert.equal((await fetch(base+'/not-a-page',{headers:{Accept:'application/json'}})).status,404);
  } finally { await new Promise<void>((resolve,reject)=>server.close(error=>error?reject(error):resolve())); }
});
