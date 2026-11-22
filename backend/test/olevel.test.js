import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { useTempDataDir } from './helpers.js';

useTempDataDir('quiz-olevel-');
const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { initStorage } = await import('../src/storage/jsonStorage.js');
const { setAdminCredentials } = await import('../src/services/authService.js');
const { parseMcqText } = await import('../src/services/mcqParser.js');

const ADMIN = { username: 'admin', password: 'CorrectHorse123' };
const H = { 'X-Requested-With': 'quiz-platform' };
let app;
let agent;

const SAMPLE = `Q1. What is 2+2?
A. 3
B. 4
C. 5
D. 6
Answer: B
Topic: Arithmetic
Explanation: Basic.

Q2. Second question?
A. a
B. b
C. c
D. d
विषय: संख्या पद्धति
Answer: A`;

async function mk(extra = {}, text = SAMPLE) {
  const r = await agent.post('/api/admin/quizzes').set(H).send({
    title: `OL ${Math.random().toString(36).slice(2, 7)}`,
    durationMinutes: 10,
    marksPerQuestion: 1,
    ...extra,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const parsed = await agent.post('/api/admin/import/parse').set(H).send({ text });
  const saved = await agent.post(`/api/admin/quizzes/${r.body.quiz.id}/questions`).set(H).send({ questions: parsed.body.questions });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  return r.body.quiz;
}

describe('O Level fields', () => {
  before(async () => {
    await initStorage();
    await setAdminCredentials(ADMIN.username, ADMIN.password);
    app = createApp();
    agent = request.agent(app);
    assert.equal((await agent.post('/api/auth/login').set(H).send(ADMIN)).status, 200);
  });

  test('parser reads English and Hindi Topic lines', () => {
    const r = parseMcqText(SAMPLE);
    assert.equal(r.questions[0].topic, 'Arithmetic');
    assert.equal(r.questions[1].topic, 'संख्या पद्धति');
    assert.equal(r.questions[0].correct_answer, 'B');
    assert.equal(r.questions[0].explanation, 'Basic.');
  });

  test('quizzes without the new fields still work (backward compatible)', async () => {
    const q = await mk();
    assert.equal(q.module ?? null, null);
    const pub = await agent.post(`/api/admin/quizzes/${q.id}/publish`).set(H);
    assert.equal(pub.status, 200);
  });

  test('module/topic/year/seo saved, rejected when invalid', async () => {
    const q = await mk({ module: 'm1-r5', topic: 'IT Tools', year: 2024, seoTitle: 'T', seoDescription: 'D' });
    assert.equal(q.module, 'm1-r5');
    assert.equal(q.year, 2024);
    const bad = await agent.post('/api/admin/quizzes').set(H).send({ title: 'Bad', durationMinutes: 5, marksPerQuestion: 1, module: 'zzz' });
    assert.equal(bad.status, 400);
  });

  test('GET /api/public/quizzes lists only published, no answers, filters module', async () => {
    const pubd = await mk({ module: 'm2-r5' });
    const draft = await mk({ module: 'm2-r5' });
    await agent.post(`/api/admin/quizzes/${pubd.id}/publish`).set(H);
    const r = await request(app).get('/api/public/quizzes?module=m2-r5');
    assert.equal(r.status, 200);
    const slugs = r.body.quizzes.map((x) => x.slug);
    assert.ok(slugs.includes(pubd.slug));
    assert.ok(!slugs.includes(draft.slug));
    assert.ok(r.body.quizzes.every((x) => x.module === 'm2-r5'));
    assert.ok(!JSON.stringify(r.body).includes('correct_answer'));
    // existing route still resolves (not shadowed)
    assert.equal((await request(app).get(`/api/public/quizzes/${pubd.slug}`)).status, 200);
  });

  test('topic is stored and returned in the result review', async () => {
    const q = await mk({});
    await agent.post(`/api/admin/quizzes/${q.id}/publish`).set(H);
    const st = await request(app).post(`/api/public/quizzes/${q.slug}/start`).send({ studentName: 'Asha' });
    assert.equal(st.status, 201, JSON.stringify(st.body));
    const { attemptId, accessToken } = st.body;
    const pubQuiz = await request(app).get(`/api/public/attempts/${attemptId}`).set('X-Attempt-Token', accessToken);
    const qs = pubQuiz.body.questions;
    const answers = Object.fromEntries(qs.map((x) => [x.id, 'A']));
    await request(app).put(`/api/public/attempts/${attemptId}/answers`).set('X-Attempt-Token', accessToken).send({ answers });
    const sub = await request(app).post(`/api/public/attempts/${attemptId}/submit`).set('X-Attempt-Token', accessToken).send({ answers });
    assert.equal(sub.status, 200, JSON.stringify(sub.body));
    const token = sub.body.resultToken || sub.body.result?.resultToken;
    const res = await request(app).get(`/api/public/results/${token}`);
    assert.equal(res.status, 200, JSON.stringify(res.body));
    const topics = (res.body.result?.review || res.body.review || []).map((x) => x.topic);
    assert.deepEqual(topics.sort(), ['Arithmetic', 'संख्या पद्धति'].sort());
  });

  test('updating without the new fields keeps them', async () => {
    const q = await mk({ module: 'm3-r5', topic: 'Python', year: 2023 });
    const r = await agent.put(`/api/admin/quizzes/${q.id}`).set(H).send({ title: 'Renamed', durationMinutes: 10, marksPerQuestion: 1 });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.quiz.module, 'm3-r5');
    assert.equal(r.body.quiz.year, 2023);
    const clear = await agent.put(`/api/admin/quizzes/${q.id}`).set(H).send({ title: 'Renamed', durationMinutes: 10, marksPerQuestion: 1, module: null });
    assert.equal(clear.body.quiz.module, null);
  });

  test('published quiz WITHOUT a module is never listed publicly (private institute quizzes)', async () => {
    const priv = await mk({});
    await agent.post(`/api/admin/quizzes/${priv.id}/publish`).set(H);
    const all = await request(app).get('/api/public/quizzes');
    assert.ok(!all.body.quizzes.some((x) => x.slug === priv.slug));
    // but its direct link still works
    assert.equal((await request(app).get(`/api/public/quizzes/${priv.slug}`)).status, 200);
  });
});

describe('keep-alive', async () => {
  const { startKeepAlive } = await import('../src/services/keepAlive.js');
  test('pings <url>/api/health on the interval and can be stopped', async () => {
    const calls = [];
    const h = startKeepAlive({ url: 'https://x.onrender.com/', intervalMs: 20, fetchImpl: async (u) => { calls.push(u); return { status: 200 }; } });
    await new Promise((r) => setTimeout(r, 90));
    h.stop();
    const n = calls.length;
    assert.ok(n >= 2);
    assert.equal(calls[0], 'https://x.onrender.com/api/health');
    await new Promise((r) => setTimeout(r, 60));
    assert.equal(calls.length, n);
  });
  test('does nothing without a url and never throws on fetch errors', async () => {
    assert.equal(startKeepAlive({ url: '', intervalMs: 10 }), null);
    const h = startKeepAlive({ url: 'https://x', intervalMs: 1000, fetchImpl: async () => { throw new Error('boom'); } });
    await h.tick();
    h.stop();
  });
});
