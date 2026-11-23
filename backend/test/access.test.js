import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { useTempDataDir } from './helpers.js';

useTempDataDir('quiz-access-');
const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { initStorage } = await import('../src/storage/jsonStorage.js');
const { setAdminCredentials } = await import('../src/services/authService.js');
const { parseMcqText } = await import('../src/services/mcqParser.js');
const { clientIp } = await import('../src/middleware/rateLimiters.js');

const ADMIN = { username: 'admin', password: 'CorrectHorse123' };
const H = { 'X-Requested-With': 'quiz-platform' };
let app;
let agent;

const MIXED = `Q1. What is 2+2?
A. 3
B. 4
C. 5
D. 6
Answer: B

Q2. The CPU is the brain of the computer.
Answer: True
Explanation: It executes instructions.

Q3. RAM is a permanent storage device.
A. True
B. False
Answer: B

प्रश्न 4. मॉनिटर एक इनपुट डिवाइस है।
उत्तर: गलत

Q5. Which colour is the sky?
A. Red
B. Blue
Answer: B

Q6. Is the sky blue?
A. Yes
B. No
Answer: A`;

const CLEAN = `Q1. What is 2+2?
A. 3
B. 4
C. 5
D. 6
Answer: B

Q2. The CPU is the brain of the computer.
Answer: True`;

async function mk(extra = {}, text = CLEAN) {
  const r = await agent.post('/api/admin/quizzes').set(H).send({
    title: `AC ${Math.random().toString(36).slice(2, 7)}`,
    durationMinutes: 10,
    marksPerQuestion: 1,
    ...extra,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const parsed = await agent.post('/api/admin/import/parse').set(H).send({ text });
  const saved = await agent.post(`/api/admin/quizzes/${r.body.quiz.id}/questions`).set(H).send({ questions: parsed.body.questions });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  return { quiz: r.body.quiz, saved: saved.body };
}
async function publish(id) {
  const r = await agent.post(`/api/admin/quizzes/${id}/publish`).set(H);
  assert.equal(r.status, 200, JSON.stringify(r.body));
}
const start = (slug, body) => request(app).post(`/api/public/quizzes/${slug}/start`).send(body);

describe('True/False questions', () => {
  before(async () => {
    await initStorage();
    await setAdminCredentials(ADMIN.username, ADMIN.password);
    app = createApp();
    agent = request.agent(app);
    await agent.post('/api/auth/login').set(H).send(ADMIN);
  });

  test('parser + validator accept True/False in several shapes; plain 2-option MCQ stays invalid', async () => {
    const { saved } = await mk({}, MIXED);
    const qs = saved.questions;
    assert.equal(qs.length, 6);
    assert.deepEqual(qs.map((q) => q.type), ['mcq', 'tf', 'tf', 'tf', 'mcq', 'tf']);
    assert.equal(qs[1].correct_answer, 'A'); // True
    assert.equal(qs[2].correct_answer, 'B'); // explicit options, answer B
    assert.equal(qs[3].correct_answer, 'B'); // गलत
    assert.deepEqual(Object.keys(qs[1].options), ['A', 'B']);
    assert.equal(qs[1].valid, true);
    assert.equal(qs[3].valid, true);
    assert.equal(qs[4].valid, false); // a plain 2-option MCQ (Red/Blue) is still not valid
    assert.equal(qs[5].valid, true); // Yes/No behaves like True/False
    assert.equal(qs[5].options.A, 'Yes');
    assert.equal(saved.stats.invalid, 1);
  });

  test('JSON import: type tf, boolean answers and missing options', async () => {
    const r = await agent.post('/api/admin/import/validate').set(H).send({
      json: JSON.stringify([
        { question_no: 1, question: 'Earth is round', type: 'true_false', correct_answer: true },
        { question_no: 2, question: 'Sun is cold', type: 'tf', correct_answer: 'False' },
        { question_no: 3, question: 'Bad', type: 'tf', correct_answer: 'maybe' },
      ]),
    });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    const q = r.body.questions;
    assert.deepEqual(q.map((x) => [x.type, x.correct_answer, x.valid]), [['tf', 'A', true], ['tf', 'B', true], ['tf', 'MAYBE', false]]);
  });

  test('students get 2 options for T/F, scoring and review work, editor can switch type', async () => {
    const { quiz } = await mk({}, MIXED.replace(/\n\nQ5[\s\S]*$/, ''));
    await publish(quiz.id);
    const s = await start(quiz.slug, { studentName: 'Tester One' });
    assert.equal(s.status, 201);
    const at = await request(app).get(`/api/public/attempts/${s.body.attemptId}`).set('X-Attempt-Token', s.body.accessToken);
    const types = at.body.questions.map((q) => q.type);
    assert.deepEqual(types, ['mcq', 'tf', 'tf', 'tf']);
    assert.deepEqual(Object.keys(at.body.questions[1].options), ['A', 'B']);
    assert.equal(JSON.stringify(at.body).includes('correct_answer'), false);
    const ids = at.body.questions.map((q) => q.id);
    const sub = await request(app)
      .post(`/api/public/attempts/${s.body.attemptId}/submit`)
      .set('X-Attempt-Token', s.body.accessToken)
      .send({ answers: { [ids[0]]: 'B', [ids[1]]: 'A', [ids[2]]: 'A', [ids[3]]: 'B' } });
    assert.equal(sub.status, 200, JSON.stringify(sub.body));
    assert.equal(sub.body.summary.correct, 3);
    assert.equal(sub.body.summary.incorrect, 1);
    const res = await request(app).get(`/api/public/results/${sub.body.resultToken}`);
    assert.equal(res.body.review[2].type, 'tf');
    assert.equal(res.body.review[2].status, 'incorrect');

    // Editor: unpublish, turn Q1 (mcq) into True/False
    await agent.post(`/api/admin/quizzes/${quiz.id}/unpublish`).set(H);
    const full = await agent.get(`/api/admin/quizzes/${quiz.id}`);
    const q1 = full.body.questions[0];
    const up = await agent.put(`/api/admin/quizzes/${quiz.id}/questions/${q1.id}`).set(H).send({ type: 'tf', correct_answer: 'A' });
    assert.equal(up.status, 200, JSON.stringify(up.body));
    assert.equal(up.body.question.type, 'tf');
    assert.deepEqual(Object.keys(up.body.question.options), ['A', 'B']);
    const back = await agent.put(`/api/admin/quizzes/${quiz.id}/questions/${q1.id}`).set(H).send({ type: 'mcq', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correct_answer: 'C' });
    assert.equal(back.body.question.valid, true);
    assert.equal(back.body.question.type, 'mcq');
  });
});

describe('Student identification', () => {
  before(async () => {
    await initStorage();
    app = createApp();
    agent = request.agent(app);
    await agent.post('/api/auth/login').set(H).send(ADMIN);
  });

  test('same Start press sent twice returns the same attempt (no duplicate, no limit error)', async () => {
    const { quiz } = await mk({ maxAttempts: 1 });
    await publish(quiz.id);
    const key = 'k'.repeat(20);
    const a = await start(quiz.slug, { studentName: 'Ravi Kumar', startKey: key });
    const b = await start(quiz.slug, { studentName: 'Ravi Kumar', startKey: key });
    assert.equal(a.status, 201);
    assert.equal(b.status, 201, JSON.stringify(b.body));
    assert.equal(b.body.attemptId, a.body.attemptId);
    assert.equal(b.body.resumed, true);
    assert.notEqual(b.body.accessToken, a.body.accessToken);
    // old token is replaced, new token works
    const old = await request(app).get(`/api/public/attempts/${a.body.attemptId}`).set('X-Attempt-Token', a.body.accessToken);
    assert.equal(old.status, 403);
    const fresh = await request(app).get(`/api/public/attempts/${a.body.attemptId}`).set('X-Attempt-Token', b.body.accessToken);
    assert.equal(fresh.status, 200);
    const results = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);
    assert.equal(results.body.analytics.totalAttempts, 1);
    // a different press (new key) is a real second attempt -> limit
    const c = await start(quiz.slug, { studentName: 'Ravi Kumar', startKey: 'z'.repeat(20) });
    assert.equal(c.status, 403);
    assert.equal(c.body.error.code, 'ATTEMPT_LIMIT_REACHED');
  });

  test('changing the typed name on the same device does not give a second attempt', async () => {
    const { quiz } = await mk({ maxAttempts: 1 });
    await publish(quiz.id);
    const dev = 'device-abcdefghij12345';
    const a = await start(quiz.slug, { studentName: 'Amit Sharma', deviceId: dev, startKey: 'a'.repeat(20) });
    assert.equal(a.status, 201);
    const b = await start(quiz.slug, { studentName: 'Amit S', deviceId: dev, startKey: 'b'.repeat(20) });
    assert.equal(b.status, 403);
    assert.equal(b.body.error.code, 'ATTEMPT_LIMIT_REACHED');
    // another device is allowed; lockDevice=false also allows
    const c = await start(quiz.slug, { studentName: 'Other Person', deviceId: 'device-zzzzzzzzzz12345' });
    assert.equal(c.status, 201);
    const off = await mk({ maxAttempts: 1, lockDevice: false });
    await publish(off.quiz.id);
    await start(off.quiz.slug, { studentName: 'Amit Sharma', deviceId: dev });
    const d = await start(off.quiz.slug, { studentName: 'Amit S', deviceId: dev });
    assert.equal(d.status, 201);
  });

  test('email mode: needs a valid email, limit is per email, optional allow-list', async () => {
    const { quiz } = await mk({ maxAttempts: 1, accessMode: 'email', lockDevice: false, allowedEmails: 'a@x.in, b@x.in\nnot-an-email' });
    assert.deepEqual(quiz.allowedEmails, ['a@x.in', 'b@x.in']);
    await publish(quiz.id);
    const pub = await request(app).get(`/api/public/quizzes/${quiz.slug}`);
    assert.equal(pub.body.quiz.accessMode, 'email');
    assert.equal(pub.body.quiz.restrictedEmails, true);
    assert.equal(JSON.stringify(pub.body).includes('a@x.in'), false);
    assert.equal((await start(quiz.slug, { studentName: 'Asha' })).body.error.details[0].path, 'email');
    assert.equal((await start(quiz.slug, { studentName: 'Asha', email: 'zzz@x.in' })).body.error.code, 'EMAIL_NOT_ALLOWED');
    assert.equal((await start(quiz.slug, { studentName: 'Asha', email: 'A@X.in' })).status, 201);
    // new name, same email -> blocked
    const again = await start(quiz.slug, { studentName: 'Someone Else', email: 'a@x.in' });
    assert.equal(again.status, 403);
    assert.equal((await start(quiz.slug, { studentName: 'Bina', email: 'b@x.in' })).status, 201);
  });

  test('code mode: generate codes, name comes from the code, wrong code rejected, resume works, limit holds', async () => {
    const { quiz } = await mk({ maxAttempts: 1, accessMode: 'code' });
    const gen = await agent.post(`/api/admin/quizzes/${quiz.id}/codes`).set(H).send({ names: ['Pooja Singh', 'Rahul Verma'] });
    assert.equal(gen.status, 201, JSON.stringify(gen.body));
    assert.equal(gen.body.codes.length, 2);
    const [c1, c2] = gen.body.codes;
    assert.match(c1.display, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    const extra = await agent.post(`/api/admin/quizzes/${quiz.id}/codes`).set(H).send({ count: 3 });
    assert.equal(extra.body.codes.length, 5);
    await publish(quiz.id);

    const pub = await request(app).get(`/api/public/quizzes/${quiz.slug}`);
    assert.equal(pub.body.quiz.accessMode, 'code');
    assert.equal(JSON.stringify(pub.body).includes(c1.code), false);

    assert.equal((await start(quiz.slug, { studentName: 'X Y' })).status, 400);
    assert.equal((await start(quiz.slug, { studentName: 'X Y', code: 'AAAA-BBBB' })).body.error.code, 'INVALID_CODE');

    // typed name is ignored when the code has a name; lower case / spaces accepted
    const a = await start(quiz.slug, { studentName: 'Fake Name', code: ` ${c1.display.toLowerCase()} ` });
    assert.equal(a.status, 201, JSON.stringify(a.body));
    let results = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);
    assert.equal(results.body.inProgress[0].studentName, 'Pooja Singh');

    // lost phone: same code again while attempt is unfinished -> resume the same attempt with a new token
    const b = await start(quiz.slug, { code: c1.code });
    assert.equal(b.status, 201);
    assert.equal(b.body.attemptId, a.body.attemptId);
    assert.equal(b.body.resumed, true);

    // after submitting, the code is used up
    const sub = await request(app).post(`/api/public/attempts/${b.body.attemptId}/submit`).set('X-Attempt-Token', b.body.accessToken).send({ answers: {} });
    assert.equal(sub.status, 200);
    const c = await start(quiz.slug, { code: c1.code });
    assert.equal(c.status, 403);
    // other student's code unaffected
    assert.equal((await start(quiz.slug, { code: c2.code })).status, 201);

    const list = await agent.get(`/api/admin/quizzes/${quiz.id}/codes`);
    const row = list.body.codes.find((x) => x.code === c1.code);
    assert.equal(row.attempts, 1);
    assert.equal(row.submitted, 1);

    const del = await agent.delete(`/api/admin/quizzes/${quiz.id}/codes/${c2.display}`).set(H);
    assert.equal(del.status, 200);
    assert.equal(del.body.codes.length, 4);
    const csv = await agent.get(`/api/admin/quizzes/${quiz.id}/results/export`);
    assert.match(csv.text, /Access Code/);
    assert.match(csv.text, new RegExp(c1.display));
  });
});

describe('Admin: remove an attempt', () => {
  before(async () => {
    await initStorage();
    app = createApp();
    agent = request.agent(app);
    await agent.post('/api/auth/login').set(H).send(ADMIN);
  });

  test('deleting an attempt frees the slot and fixes the totals', async () => {
    const { quiz } = await mk({ maxAttempts: 1, lockDevice: false }, 'Q1. a?\nA. 1\nB. 2\nC. 3\nD. 4\nAnswer: A');
    await publish(quiz.id);
    const s = await start(quiz.slug, { studentName: 'Dup Student' });
    const qid = (await request(app).get(`/api/public/attempts/${s.body.attemptId}`).set('X-Attempt-Token', s.body.accessToken)).body.questions[0].id;
    await request(app).post(`/api/public/attempts/${s.body.attemptId}/submit`).set('X-Attempt-Token', s.body.accessToken).send({ answers: { [qid]: 'A' } });
    let r = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);
    assert.equal(r.body.results.length, 1);
    assert.equal(r.body.questionPerformance[0].attempted, 1);
    assert.equal((await start(quiz.slug, { studentName: 'Dup Student' })).status, 403);

    const del = await agent.delete(`/api/admin/quizzes/${quiz.id}/results/${s.body.attemptId}`).set(H);
    assert.equal(del.status, 200, JSON.stringify(del.body));
    r = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);
    assert.equal(r.body.results.length, 0);
    assert.equal(r.body.analytics.totalAttempts, 0);
    assert.equal(r.body.questionPerformance[0].attempted, 0);
    assert.equal((await start(quiz.slug, { studentName: 'Dup Student' })).status, 201);
    assert.equal((await agent.delete(`/api/admin/quizzes/${quiz.id}/results/${s.body.attemptId}`).set(H)).status, 404);
  });
});

describe('Rate limit key', () => {
  test('uses the real visitor address from X-Forwarded-For, not the shared proxy address', () => {
    assert.equal(clientIp({ headers: { 'x-forwarded-for': '49.36.1.2, 76.76.21.9' }, ip: '76.76.21.9' }), '49.36.1.2');
    assert.equal(clientIp({ headers: {}, ip: '10.0.0.1' }), '10.0.0.1');
    assert.equal(clientIp({ headers: { 'x-forwarded-for': 'garbage' }, ip: '10.0.0.1' }), '10.0.0.1');
  });
});
