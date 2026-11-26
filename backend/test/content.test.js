import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { useTempDataDir } from './helpers.js';

useTempDataDir('quiz-content-');
const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { initStorage } = await import('../src/storage/jsonStorage.js');
const { setAdminCredentials } = await import('../src/services/authService.js');
const { parseNotes, parseGuess } = await import('../src/services/contentParser.js');

const H = { 'X-Requested-With': 'quiz-platform' };
const NOTES = `Chapter 1: Intro to Computer / कंप्यूटर का परिचय
## Basics / मूल बातें
1.\tComputer एक electronic machine है।
A computer is an electronic machine.
2.\tRAM volatile है।
RAM is volatile.
Chapter 2: Operating System
3.\tOS एक system software है।`;
const GUESS = `Unit 1: Internet
1. Q: WWW का full form? — Ans: World Wide Web
2. Q: SMTP kya hai?
   Ans: Email bhejne ka protocol
Unit 2: Email
3. Q: CC ka full form — Ans: Carbon Copy`;

describe('content parser', () => {
  test('notes: chapters, sections and Hindi+English pairs', () => {
    const r = parseNotes(NOTES);
    assert.equal(r.items.length, 2);
    assert.equal(r.items[0].title, 'Intro to Computer');
    assert.equal(r.items[0].hi, 'कंप्यूटर का परिचय');
    assert.equal(r.items[0].sections[0].en, 'Basics');
    assert.deepEqual(r.items[0].sections[0].blocks[1].p, ['RAM volatile है।', 'RAM is volatile.']);
    assert.equal(r.items[0].points, 2);
    assert.ok(r.warnings.some((w) => /English line nahi/.test(w)));
    assert.equal(r.items[0].slug, '1-intro-to-computer');
  });
  test('guess: inline and two-line Q/A', () => {
    const r = parseGuess(GUESS);
    assert.equal(r.items.length, 2);
    assert.equal(r.items[0].items.length, 2);
    assert.deepEqual(r.items[0].items[1], ['SMTP kya hai?', 'Email bhejne ka protocol']);
    assert.equal(r.stats.entries, 3);
  });
  test('rubbish gives warnings and no groups', () => {
    const r = parseGuess('hello world');
    assert.equal(r.items.length, 0);
    assert.ok(r.warnings.length > 0);
  });
});

describe('content API', () => {
  let agent;
  before(async () => {
    await initStorage();
    await setAdminCredentials('admin', 'CorrectHorse123');
    const app = createApp();
    agent = request.agent(app);
    await agent.post('/api/auth/login').set(H).send({ username: 'admin', password: 'CorrectHorse123' }).expect(200);
    globalThis.__app = app;
  });
  test('admin only', async () => {
    await request(globalThis.__app).put('/api/admin/content/notes/m1-r5').set(H).send({ text: NOTES }).expect(401);
  });
  test('parse does not save; save + public read + merge + delete', async () => {
    const pub = () => request(globalThis.__app).get('/api/public/content/notes/m1-r5');
    assert.equal((await pub().expect(200)).body.override, null);
    const p = await agent.post('/api/admin/content/notes/m1-r5/parse').set(H).send({ text: NOTES }).expect(200);
    assert.equal(p.body.stats.entries, 3);
    assert.equal((await pub()).body.override, null);
    await agent.put('/api/admin/content/notes/m1-r5').set(H).send({ text: NOTES }).expect(200);
    let o = (await pub()).body.override;
    assert.equal(o.items.length, 2);
    await agent.put('/api/admin/content/notes/m1-r5').set(H).send({ text: 'Chapter 2: New OS\n1. नया point\nnew point' }).expect(200);
    o = (await pub()).body.override;
    assert.equal(o.items.length, 2);
    assert.equal(o.items[1].title, 'New OS');
    await agent.delete('/api/admin/content/notes/m1-r5?n=2').set(H).expect(200);
    assert.equal((await pub()).body.override.items.length, 1);
    await agent.delete('/api/admin/content/notes/m1-r5').set(H).expect(200);
    assert.equal((await pub()).body.override, null);
    await agent.delete('/api/admin/content/notes/m1-r5').set(H).expect(404);
  });
  test('rejects bad kind/module and empty text', async () => {
    await agent.put('/api/admin/content/quiz/m1-r5').set(H).send({ text: NOTES }).expect(400);
    await agent.put('/api/admin/content/guess/m9-r5').set(H).send({ text: GUESS }).expect(400);
    await agent.put('/api/admin/content/guess/m1-r5').set(H).send({ text: 'nothing useful' }).expect(400);
  });
});
