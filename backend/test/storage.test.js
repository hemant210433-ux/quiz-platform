import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { useTempDataDir } from './helpers.js';

const dir = useTempDataDir('quiz-storage-');
const storage = await import('../src/storage/jsonStorage.js');

describe('JSON storage', () => {
  before(async () => {
    storage.setDataDir(dir);
    await storage.initStorage();
  });

  test('creates default files', async () => {
    assert.deepEqual(await storage.readJson('quizzes.json'), []);
    assert.ok(fs.existsSync(path.join(dir, 'questions')));
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
    // file is valid JSON and no temp files are left behind
    JSON.parse(fs.readFileSync(path.join(dir, 'counter.json'), 'utf8'));
    assert.equal(fs.readdirSync(dir).filter((f) => f.includes('.tmp-')).length, 0);
  });

  test('concurrent writes to different files', async () => {
    await Promise.all(Array.from({ length: 50 }, (_, i) => storage.writeJson(`multi/f${i}.json`, { i })));
    for (let i = 0; i < 50; i++) assert.deepEqual(await storage.readJson(`multi/f${i}.json`), { i });
  });

  test('keeps a .bak copy and recovers from a corrupt file', async () => {
    await storage.writeJson('doc.json', { v: 1 });
    await storage.writeJson('doc.json', { v: 2 });
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'doc.json.bak'), 'utf8')), { v: 1 });
    fs.writeFileSync(path.join(dir, 'doc.json'), '{"v": 2, broken');
    const recovered = await storage.readJson('doc.json');
    assert.deepEqual(recovered, { v: 1 });
    assert.ok(fs.readdirSync(dir).some((f) => f.startsWith('doc.json.corrupt-')));
  });

  test('missing file returns the fallback', async () => {
    assert.deepEqual(await storage.readJson('nope.json', { x: 1 }), { x: 1 });
  });

  test('refuses paths outside the data directory', async () => {
    await assert.rejects(() => storage.readJson('../escape.json'), /outside data directory/);
  });

  test('schema validation prevents saving invalid data', async () => {
    const { z } = await import('zod');
    await assert.rejects(() => storage.writeJson('typed.json', { a: 'x' }, { schema: z.object({ a: z.number() }) }), /invalid data/);
    assert.equal(fs.existsSync(path.join(dir, 'typed.json')), false);
  });
});
