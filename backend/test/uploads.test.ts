import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Server } from 'node:http';
import sharp from 'sharp';

const schema = 'edible_upload_test_' + randomUUID().replaceAll('-', '');
process.env.DB_SCHEMA = schema;
const { pool, config } = await import('../src/db.js');
const { migrate } = await import('../src/migrate.js');
const { hashPassword } = await import('../src/auth.js');
const { app } = await import('../src/app.js');

test('persistent photos, private biodata, and atomic vendor batch creation', { timeout: 120000 }, async t => {
  let server: Server | undefined;
  const accounts: Record<string, { id: string; cookie: string }> = {};
  const password = 'Upload-test-password-42';
  let base = '';
  const json = async (method: string, path: string, body?: unknown, account?: string) => {
    const response = await fetch(base + path, { method, headers: { Origin: config.appUrl, 'Content-Type': 'application/json', ...(account ? { Cookie: accounts[account].cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() as any, cookie: response.headers.get('set-cookie')?.split(';')[0] || '' };
  };
  const png = await sharp({ create: { width: 80, height: 60, channels: 3, background: 'green' } }).png().withMetadata().toBuffer();
  const upload = async (purpose: string, account?: string, data = png, type = 'image/png', origin = config.appUrl) => {
    const response = await fetch(base + '/uploads/' + purpose, { method: 'POST', headers: { Origin: origin, 'Content-Type': type, ...(account ? { Cookie: accounts[account].cookie } : {}) }, body: data });
    return { status: response.status, body: await response.json() as any };
  };
  const product = { name: 'Photo product', category: 'Snacks', origin: 'Lagos', priceMinor: 15000, stock: 12, unit: 'pack' };
  try {
    await pool.query(`CREATE SCHEMA ${schema}`); await migrate(); await migrate();
    server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server!.once('listening', resolve));
    base = `http://127.0.0.1:${(server.address() as any).port}/api`;
    for (const key of ['buyer', 'vendor', 'vendor2', 'admin']) {
      const userId = randomUUID(); const role = key.startsWith('vendor') ? 'seller' : key;
      await pool.query('INSERT INTO users(id,email,name,password_hash,role) VALUES($1,$2,$3,$4,$5)', [userId, key + '@uploads.test', key, await hashPassword(password), role]);
      if (role === 'seller') await pool.query("INSERT INTO seller_applications(id,user_id,business_name,legal_entity_name,registration_number,category,location,phone,status) VALUES($1,$2,$3,$3,'','Snacks','Lagos','123','Approved')", [randomUUID(), userId, key]);
      const login = await json('POST', '/auth/login', { email: key + '@uploads.test', password });
      assert.equal(login.status, 200); accounts[key] = { id: userId, cookie: login.cookie };
    }
    await t.test('upload authentication, origin protection, types and size limits', async () => {
      assert.equal((await upload('product')).status, 401);
      assert.equal((await upload('product', 'buyer')).status, 403);
      assert.equal((await upload('product', 'vendor', png, 'image/png', 'https://attacker.example')).status, 403);
      assert.equal((await upload('profile', 'buyer', Buffer.from('<svg/>'), 'image/svg+xml')).status, 415);
      assert.equal((await upload('profile', 'buyer', Buffer.from('not a picture'), 'image/png')).status, 400);
      assert.equal((await upload('profile', 'buyer', Buffer.alloc(5 * 1024 * 1024 + 1), 'image/png')).status, 413);
    });
    await t.test('every account role can save and remove a profile photo and optional biodata', async () => {
      for (const key of ['buyer', 'vendor', 'admin']) {
        const image = await upload('profile', key); assert.equal(image.status, 201, JSON.stringify(image.body));
        assert.equal((await fetch(base.replace(/\/api$/, '') + image.body.url)).status, 404, 'Unattached uploads are private');
        const profile = await json('PATCH', '/account', { profileImage: image.body.url, dateOfBirth: '1995-06-15', gender: 'Woman', nationality: 'Nigerian', occupation: 'Trader' }, key);
        assert.equal(profile.status, 200, JSON.stringify(profile.body));
        const saved = (await json('GET', '/auth/me', undefined, key)).body.user;
        assert.equal(saved.profileImage, image.body.url); assert.equal(saved.dateOfBirth, '1995-06-15'); assert.equal(saved.occupation, 'Trader');
        const response = await fetch(base.replace(/\/api$/, '') + image.body.url);
        assert.equal(response.status, 200); assert.equal(response.headers.get('content-type'), 'image/webp');
        const metadata = await sharp(Buffer.from(await response.arrayBuffer())).metadata();
        assert.equal(metadata.width, 80); assert.equal(metadata.exif, undefined);
        assert.equal((await json('PATCH', '/account', { profileImage: image.body.url }, 'vendor2')).status, 400);
        assert.equal((await json('PATCH', '/account', { dateOfBirth: '2999-01-01' }, key)).status, 400);
        assert.equal((await json('PATCH', '/account', { dateOfBirth: '2025-02-30' }, key)).status, 400);
        assert.equal((await json('PATCH', '/account', { profileImage: '', dateOfBirth: '', gender: '', nationality: '', occupation: '' }, key)).status, 200);
      }
    });
    await t.test('product galleries, ownership checks and backwards-compatible covers', async () => {
      const first = await upload('product', 'vendor'); const second = await upload('product', 'vendor');
      assert.equal(first.status, 201); assert.equal(second.status, 201);
      const gallery = [first.body.url, second.body.url];
      const created = await json('POST', '/seller/products', { ...product, images: gallery }, 'vendor');
      assert.equal(created.status, 201, JSON.stringify(created.body)); assert.deepEqual(created.body.product.images, gallery); assert.equal(created.body.product.image, gallery[0]);
      const publicProduct = await json('GET', '/products/' + created.body.product.id);
      assert.deepEqual(publicProduct.body.product.images, gallery); assert.equal(publicProduct.body.product.dateOfBirth, undefined);
      assert.equal((await json('POST', '/seller/products', { ...product, images: gallery }, 'vendor2')).status, 400);
      assert.equal((await json('PATCH', '/seller/products/' + created.body.product.id, { images: gallery }, 'vendor2')).status, 400);
      assert.equal((await json('POST', '/seller/products', { ...product, images: Array(7).fill(gallery[0]) }, 'vendor')).status, 400);
      const profile = await upload('profile', 'vendor');
      assert.equal((await json('POST', '/seller/products', { ...product, images: [profile.body.url] }, 'vendor')).status, 400);
      const reordered = await json('PATCH', '/seller/products/' + created.body.product.id, { images: [...gallery].reverse() }, 'vendor');
      assert.equal(reordered.status, 200); assert.equal(reordered.body.product.image, gallery[1]);
      const cleared = await json('PATCH', '/seller/products/' + created.body.product.id, { images: [] }, 'vendor');
      assert.equal(cleared.status, 200); assert.equal(cleared.body.product.image, '');
      const legacy = await json('PATCH', '/seller/products/' + created.body.product.id, { image: 'https://example.test/food.jpg' }, 'vendor');
      assert.deepEqual(legacy.body.product.images, ['https://example.test/food.jpg']);
    });
    await t.test('multiple products save atomically and enforce vendor permissions', async () => {
      const image = await upload('product', 'vendor');
      assert.equal((await json('POST', '/seller/products/batch', { products: [product] }, 'buyer')).status, 403);
      const batch = await json('POST', '/seller/products/batch', { products: [{ ...product, name: 'Batch one', images: [image.body.url] }, { ...product, name: 'Batch two' }] }, 'vendor');
      assert.equal(batch.status, 201, JSON.stringify(batch.body)); assert.equal(batch.body.products.length, 2);
      const before = Number((await pool.query('SELECT count(*) count FROM products')).rows[0].count);
      const wrongOwner = await upload('product', 'vendor2');
      assert.equal((await json('POST', '/seller/products/batch', { products: [product, { ...product, images: [wrongOwner.body.url] }] }, 'vendor')).status, 400);
      assert.equal(Number((await pool.query('SELECT count(*) count FROM products')).rows[0].count), before, 'A failing second product rolls back the first');
      assert.equal((await json('POST', '/seller/products/batch', { products: [product, { ...product, stock: -1 }] }, 'vendor')).status, 400);
      assert.equal((await json('POST', '/seller/products/batch', { products: Array(21).fill(product) }, 'vendor')).status, 400);
      assert.equal(Number((await pool.query('SELECT count(*) count FROM products')).rows[0].count), before);
      const fullBatch = await json('POST', '/seller/products/batch', { products: Array.from({length:20}, (_, index) => ({...product, name:`Full batch ${index}`, description:'A'.repeat(5000)})) }, 'vendor');
      assert.equal(fullBatch.status, 201, JSON.stringify(fullBatch.body)); assert.equal(fullBatch.body.products.length, 20);
    });
  } finally {
    if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve()));
    await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await pool.end();
  }
});
