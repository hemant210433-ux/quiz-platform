/**
 * Storage tests against a real MongoDB.
 *   MONGODB_URI=mongodb://127.0.0.1:27017 npm run test:mongo
 * Skipped automatically when MONGODB_URI is not set.
 */
import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.TEST_USE_MONGO = '1';
process.env.MONGODB_DB = `qp_test_${Date.now()}`;
const skip = !process.env.MONGODB_URI && 'MONGODB_URI not set';

const storage = skip ? null : await import('../src/storage/jsonStorage.js');
const { MongoClient } = skip ? {} : await import('mongodb');

describe('MongoDB storage', { skip }, () => {
  before(async () => {
    await storage.initStorage();
  });
  after(async () => {
    await storage.closeStorage();
    const c = new MongoClient(process.env.MONGODB_URI);
    await c.connect();
    await c.db(process.env.MONGODB_DB).dropDatabase();
    await c.close();
  });

  test('uses MongoDB and creates defaults', async () => {
    assert.equal(storage.usingMongo, true);
    assert.deepEqual(await storage.readJson('quizzes.json'), []);
    assert.equal((await storage.readJson('settings.json')).siteName, 'Quiz Platform');
  });

  test('read fallback / write / read / exists / delete', async () => {
    assert.deepEqual(await storage.readJson('nope.json', { a: 1 }), { a: 1 });
    assert.equal(await storage.exists('x/one.json'), false);
    await storage.writeJson('x/one.json', { hello: 'दुनिया', n: [1, 2, 3] });
    assert.deepEqual(await storage.readJson('x/one.json'), { hello: 'दुनिया', n: [1, 2, 3] });
    assert.equal(await storage.exists('x/one.json'), true);
    await storage.deletePath('x/one.json');
    assert.equal(await storage.exists('x/one.json'), false);
  });

  test('500 concurrent read-modify-write updates lose nothing', async () => {
    await storage.writeJson('counter.json', { n: 0, items: [] });
    await Promise.all(
      Array.from({ length: 500 }, (_, i) =>
        storage.updateJson('counter.json', { n: 0, items: [] }, (d) => {
          d.n += 1;
          d.items.push(i);
        }),
      ),
    );
    const d = await storage.readJson('counter.json');
    assert.equal(d.n, 500);
    assert.equal(new Set(d.items).size, 500);
  });

  test('updateJson creates a missing document from the fallback, returns ctx.result, supports skipWrite', async () => {
    const r = await storage.updateJson('fresh.json', { list: [] }, (d, ctx) => {
      d.list.push(1);
      ctx.result = 'made';
    });
    assert.equal(r, 'made');
    assert.deepEqual(await storage.readJson('fresh.json'), { list: [1] });
    await storage.updateJson('fresh.json', { list: [] }, (d, ctx) => {
      d.list.push(2);
      ctx.skipWrite = true;
    });
    assert.deepEqual(await storage.readJson('fresh.json'), { list: [1] });
  });

  test('two independent store instances never lose updates (optimistic versioning)', async () => {
    const c1 = new MongoClient(process.env.MONGODB_URI);
    const c2 = new MongoClient(process.env.MONGODB_URI);
    await Promise.all([c1.connect(), c2.connect()]);
    const col1 = c1.db(process.env.MONGODB_DB).collection('kv');
    const col2 = c2.db(process.env.MONGODB_DB).collection('kv');
    await storage.writeJson('multi.json', { n: 0 });
    // Simulate another server instance bumping the document between our read and write.
    let first = true;
    await storage.updateJson('multi.json', { n: 0 }, async (d) => {
      if (first) {
        first = false;
        await col2.updateOne({ _id: 'multi.json' }, { $set: { v: { n: 100 } }, $inc: { ver: 1 } });
      }
      d.n += 1;
    });
    assert.equal((await storage.readJson('multi.json')).n, 101);
    await Promise.all([c1.close(), c2.close()]);
    void col1;
  });

  test('schema validation refuses invalid data and writes nothing', async () => {
    const { z } = await import('zod');
    const schema = z.object({ a: z.number() });
    await assert.rejects(() => storage.writeJson('v.json', { a: 'x' }, { schema }));
    assert.equal(await storage.exists('v.json'), false);
  });

  test('prefix operations: listJsonFiles, deletePath on a "directory", collectDataFiles, clearDirs', async () => {
    await storage.writeJson('questions/aaa111.json', { q: 1 });
    await storage.writeJson('questions/bbb222.json', { q: 2 });
    await storage.writeJson('attempts/aaa111/index.json', { attempts: [] });
    await storage.writeJson('attempts/aaa111/aaa111-tok.json', { a: 1 });
    await storage.writeJson('attempts/zzz999/index.json', { attempts: [] });
    await storage.writeJson('sessions.json', { s: 1 });
    await storage.writeJson('backups/backup-1.json', { big: true });

    assert.deepEqual((await storage.listJsonFiles('questions')).sort(), ['aaa111.json', 'bbb222.json']);

    const all = await storage.collectDataFiles();
    assert.ok(all['questions/aaa111.json']);
    assert.ok(all['attempts/aaa111/index.json']);
    assert.equal(all['sessions.json'], undefined);
    assert.equal(all['backups/backup-1.json'], undefined);

    await storage.deletePath('attempts/aaa111');
    assert.equal(await storage.exists('attempts/aaa111/index.json'), false);
    assert.equal(await storage.exists('attempts/aaa111/aaa111-tok.json'), false);
    assert.equal(await storage.exists('attempts/zzz999/index.json'), true); // sibling untouched

    await storage.clearDirs(['questions', 'attempts']);
    assert.deepEqual(await storage.listJsonFiles('questions'), []);
    assert.equal(await storage.exists('attempts/zzz999/index.json'), false);
    assert.equal(await storage.exists('backups/backup-1.json'), true);
  });

  test('listFilesMeta reports name, size and time for backups', async () => {
    await storage.writeJson('backups/backup-2026-x.json', { files: {} });
    const list = await storage.listFilesMeta('backups', { prefix: 'backup-', suffix: '.json' });
    const row = list.find((r) => r.name === 'backup-2026-x.json');
    assert.ok(row && row.size > 0 && !Number.isNaN(Date.parse(row.createdAt)));
  });

  test('rejects path-traversal style keys', async () => {
    await assert.rejects(() => storage.readJson('../etc/passwd'));
    await assert.rejects(() => storage.writeJson('/abs.json', {}));
  });
});
