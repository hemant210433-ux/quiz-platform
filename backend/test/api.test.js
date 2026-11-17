import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { useTempDataDir, generateMcqs } from './helpers.js';

useTempDataDir('quiz-api-');
const request = (await import('supertest')).default;
const { createApp } = await import('../src/app.js');
const { initStorage } = await import('../src/storage/jsonStorage.js');
const { setAdminCredentials } = await import('../src/services/authService.js');
const clock = await import('../src/utils/clock.js');

const ADMIN = { username: 'admin', password: 'CorrectHorse123' };
const H = { 'X-Requested-With': 'quiz-platform' };

let app;
let agent; // logged-in admin agent (keeps cookies)

async function login() {
  const a = request.agent(app);
  const r = await a.post('/api/auth/login').set(H).send(ADMIN);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return a;
}

async function createQuizWithQuestions(n = 10, extra = {}) {
  const r = await agent.post('/api/admin/quizzes').set(H).send({
    title: `Test Quiz ${Math.random().toString(36).slice(2, 7)}`,
    description: 'desc',
    durationMinutes: 10,
    marksPerQuestion: 2,
    ...extra,
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const quiz = r.body.quiz;
  const parsed = await agent.post('/api/admin/import/parse').set(H).send({ text: generateMcqs(n) });
  assert.equal(parsed.status, 200);
  const saved = await agent.post(`/api/admin/quizzes/${quiz.id}/questions`).set(H).send({ questions: parsed.body.questions });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  return { quiz: saved.body.quiz, questions: saved.body.questions };
}

async function publish(quizId) {
  const r = await agent.post(`/api/admin/quizzes/${quizId}/publish`).set(H);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  return r.body.quiz;
}

async function startAttempt(slug, name = 'Asha', studentId = '') {
  return request(app).post(`/api/public/quizzes/${slug}/start`).send({ studentName: name, studentId });
}

describe('API', () => {
  before(async () => {
    await initStorage();
    await setAdminCredentials(ADMIN.username, ADMIN.password);
    app = createApp();
    agent = await login();
  });

  test('health check', async () => {
    const r = await request(app).get('/api/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.status, 'ok');
  });

  describe('admin authentication', () => {
    test('valid login sets an HTTP-only cookie', async () => {
      const r = await request(app).post('/api/auth/login').set(H).send(ADMIN);
      assert.equal(r.status, 200);
      const cookie = r.headers['set-cookie'][0];
      assert.match(cookie, /HttpOnly/i);
      assert.match(cookie, /SameSite=Lax/i);
      assert.equal(r.body.admin.username, 'admin');
      assert.equal(JSON.stringify(r.body).includes('passwordHash'), false);
    });

    test('invalid login is rejected', async () => {
      const r = await request(app).post('/api/auth/login').set(H).send({ username: 'admin', password: 'wrong-password1' });
      assert.equal(r.status, 401);
      assert.equal(r.body.error.code, 'INVALID_CREDENTIALS');
      const r2 = await request(app).post('/api/auth/login').set(H).send({ username: 'nobody', password: ADMIN.password });
      assert.equal(r2.status, 401);
    });

    test('admin APIs require login', async () => {
      const r = await request(app).get('/api/admin/quizzes').set(H);
      assert.equal(r.status, 401);
      const r2 = await request(app).get('/api/admin/quizzes/abcdefghij/results').set(H);
      assert.equal(r2.status, 401);
    });

    test('state-changing admin calls require the CSRF header', async () => {
      const r = await agent.post('/api/admin/quizzes').send({ title: 'x', durationMinutes: 5, marksPerQuestion: 1 });
      assert.equal(r.status, 403);
      assert.equal(r.body.error.code, 'CSRF_CHECK_FAILED');
    });

    test('me + logout', async () => {
      const a = await login();
      assert.equal((await a.get('/api/auth/me')).status, 200);
      assert.equal((await a.post('/api/auth/logout').set(H)).status, 200);
      assert.equal((await a.get('/api/auth/me')).status, 401);
      assert.equal((await a.get('/api/admin/quizzes')).status, 401);
    });
  });

  describe('quiz management', () => {
    test('create quiz validates input', async () => {
      const bad = await agent.post('/api/admin/quizzes').set(H).send({ title: '', durationMinutes: 0, marksPerQuestion: -1 });
      assert.equal(bad.status, 400);
      assert.ok(bad.body.error.details.length >= 3);
    });

    test('create, list, update, duplicate, delete', async () => {
      const r = await agent.post('/api/admin/quizzes').set(H).send({ title: 'CCC September 2026', durationMinutes: 30, marksPerQuestion: 1 });
      assert.equal(r.status, 201);
      assert.equal(r.body.quiz.slug, 'ccc-september-2026');
      assert.equal(r.body.quiz.status, 'draft');
      const id = r.body.quiz.id;

      const list = await agent.get('/api/admin/quizzes');
      assert.ok(list.body.quizzes.some((q) => q.id === id));

      const up = await agent.put(`/api/admin/quizzes/${id}`).set(H).send({ title: 'CCC Sep', durationMinutes: 45, marksPerQuestion: 1, slug: 'ccc-sep' });
      assert.equal(up.status, 200);
      assert.equal(up.body.quiz.slug, 'ccc-sep');

      const dup = await agent.post(`/api/admin/quizzes/${id}/duplicate`).set(H);
      assert.equal(dup.status, 201);
      assert.notEqual(dup.body.quiz.slug, 'ccc-sep');

      const slugClash = await agent.put(`/api/admin/quizzes/${dup.body.quiz.id}`).set(H).send({ title: 'x', durationMinutes: 5, marksPerQuestion: 1, slug: 'ccc-sep' });
      assert.equal(slugClash.status, 409);

      assert.equal((await agent.delete(`/api/admin/quizzes/${dup.body.quiz.id}`).set(H)).status, 200);
      assert.equal((await agent.get(`/api/admin/quizzes/${dup.body.quiz.id}`)).status, 404);
    });

    test('cannot publish with invalid or zero questions', async () => {
      const r = await agent.post('/api/admin/quizzes').set(H).send({ title: 'Empty', durationMinutes: 5, marksPerQuestion: 1 });
      const empty = await agent.post(`/api/admin/quizzes/${r.body.quiz.id}/publish`).set(H);
      assert.equal(empty.status, 409);

      const parsed = await agent.post('/api/admin/import/parse').set(H).send({ text: 'Q1. ok?\nA. a\nB. b\nC. c\nD. d\nAnswer: A\nQ2. bad?\nA. a\nB. b\nAnswer: Z' });
      assert.equal(parsed.body.stats.invalid, 1);
      await agent.post(`/api/admin/quizzes/${r.body.quiz.id}/questions`).set(H).send({ questions: parsed.body.questions });
      const blocked = await agent.post(`/api/admin/quizzes/${r.body.quiz.id}/publish`).set(H);
      assert.equal(blocked.status, 409);
      assert.match(blocked.body.error.details[0], /invalid/);
    });

    test('parse-time problems survive saving and keep blocking publish until edited', async () => {
      const r = await agent.post('/api/admin/quizzes').set(H).send({ title: 'Malformed', durationMinutes: 5, marksPerQuestion: 1 });
      const id = r.body.quiz.id;
      const parsed = await agent.post('/api/admin/import/parse').set(H).send({ text: 'Q1. x?\nA. a\nB. b\nB. again\nC. c\nD. d\nAnswer: A' });
      assert.equal(parsed.body.stats.invalid, 1);
      const saved = await agent.post(`/api/admin/quizzes/${id}/questions`).set(H).send({ questions: parsed.body.questions });
      assert.equal(saved.body.stats.invalid, 1);
      assert.equal((await agent.post(`/api/admin/quizzes/${id}/publish`).set(H)).status, 409);
      const qid = saved.body.questions[0].id;
      const ed = await agent.put(`/api/admin/quizzes/${id}/questions/${qid}`).set(H).send({ question: 'x? (reviewed)' });
      assert.equal(ed.body.stats.invalid, 0);
      assert.equal((await agent.post(`/api/admin/quizzes/${id}/publish`).set(H)).status, 200);
    });

    test('1000 MCQ import end-to-end and publish', async () => {
      const { quiz, questions } = await createQuizWithQuestions(1000);
      assert.equal(quiz.questionCount, 1000);
      assert.equal(questions.length, 1000);
      assert.ok(questions.every((q) => q.id && q.valid));
      const published = await publish(quiz.id);
      assert.equal(published.status, 'published');
    });

    test('single question edit / delete and editing lock while published', async () => {
      const { quiz, questions } = await createQuizWithQuestions(3);
      const qid = questions[0].id;
      const ed = await agent.put(`/api/admin/quizzes/${quiz.id}/questions/${qid}`).set(H).send({ question: 'Edited?', correct_answer: 'D' });
      assert.equal(ed.status, 200);
      assert.equal(ed.body.question.question, 'Edited?');
      assert.equal(ed.body.question.correct_answer, 'D');
      const del = await agent.delete(`/api/admin/quizzes/${quiz.id}/questions/${questions[2].id}`).set(H);
      assert.equal(del.body.stats.total, 2);
      await publish(quiz.id);
      const locked = await agent.put(`/api/admin/quizzes/${quiz.id}/questions/${qid}`).set(H).send({ question: 'x' });
      assert.equal(locked.status, 409);
      const un = await agent.post(`/api/admin/quizzes/${quiz.id}/unpublish`).set(H);
      assert.equal(un.body.quiz.status, 'draft');
    });

    test('JSON validate endpoint and question export', async () => {
      const bad = await agent.post('/api/admin/import/validate').set(H).send({ json: '{oops' });
      assert.equal(bad.status, 400);
      const { quiz } = await createQuizWithQuestions(5);
      const ex = await agent.get(`/api/admin/quizzes/${quiz.id}/export`);
      assert.equal(ex.status, 200);
      const arr = JSON.parse(ex.text);
      assert.equal(arr.length, 5);
      assert.deepEqual(Object.keys(arr[0]).sort(), ['correct_answer', 'explanation', 'options', 'question', 'question_no']);
      const re = await agent.post('/api/admin/import/validate').set(H).send({ json: ex.text });
      assert.equal(re.body.stats.valid, 5);
    });
  });

  describe('student flow', () => {
    let quiz;
    let questions;

    before(async () => {
      ({ quiz, questions } = await createQuizWithQuestions(10, { negativeMarking: true, negativeMarks: 0.5, maxAttempts: 2 }));
      quiz = await publish(quiz.id);
    });

    test('draft quizzes are not publicly accessible', async () => {
      const r = await agent.post('/api/admin/quizzes').set(H).send({ title: 'Secret draft', durationMinutes: 5, marksPerQuestion: 1 });
      assert.equal((await request(app).get(`/api/public/quizzes/${r.body.quiz.slug}`)).status, 404);
      assert.equal((await startAttempt(r.body.quiz.slug)).status, 404);
    });

    test('public link shows quiz info without answers', async () => {
      const r = await request(app).get(`/api/public/quizzes/${quiz.slug}`);
      assert.equal(r.status, 200);
      assert.equal(r.body.quiz.questionCount, 10);
      assert.equal(r.body.quiz.maxMarks, 20);
      assert.equal(r.body.availability.open, true);
      assert.equal(JSON.stringify(r.body).includes('correct_answer'), false);
    });

    test('start requires a name', async () => {
      const r = await startAttempt(quiz.slug, ' ');
      assert.equal(r.status, 400);
    });

    test('full attempt: save, refresh/resume, submit, score, result visibility', async () => {
      const s = await startAttempt(quiz.slug, 'Ravi Kumar', 'R-01');
      assert.equal(s.status, 201);
      const { attemptId, accessToken } = s.body;

      // fetching the attempt never includes answers
      const a1 = await request(app).get(`/api/public/attempts/${attemptId}`).set('X-Attempt-Token', accessToken);
      assert.equal(a1.status, 200);
      assert.equal(a1.body.questions.length, 10);
      const raw = JSON.stringify(a1.body);
      assert.equal(raw.includes('correct_answer'), false);
      assert.equal(raw.includes('Explanation for question'), false);
      assert.ok(a1.body.remainingSeconds > 590);

      // answer: 6 correct, 2 wrong, 2 unattempted
      const answers = {};
      questions.forEach((q, i) => {
        if (i < 6) answers[q.id] = q.correct_answer;
        else if (i < 8) answers[q.id] = q.correct_answer === 'A' ? 'B' : 'A';
      });
      const save = await request(app)
        .put(`/api/public/attempts/${attemptId}/answers`)
        .set('X-Attempt-Token', accessToken)
        .send({ answers, marked: [questions[9].id] });
      assert.equal(save.status, 200);
      assert.equal(save.body.answeredCount, 8);

      // page refresh: answers restored from the server
      const a2 = await request(app).get(`/api/public/attempts/${attemptId}`).set('X-Attempt-Token', accessToken);
      assert.deepEqual(a2.body.answers, answers);
      assert.deepEqual(a2.body.marked, [questions[9].id]);

      // wrong token cannot read or write the attempt
      assert.equal((await request(app).get(`/api/public/attempts/${attemptId}`).set('X-Attempt-Token', 'nope')).status, 403);
      assert.equal((await request(app).put(`/api/public/attempts/${attemptId}/answers`).send({ answers: {} })).status, 403);

      // students cannot submit a score
      const sub = await request(app)
        .post(`/api/public/attempts/${attemptId}/submit`)
        .set('X-Attempt-Token', accessToken)
        .send({ answers: {}, score: 9999, obtainedMarks: 9999 });
      assert.equal(sub.status, 200);
      const sm = sub.body.summary;
      assert.deepEqual(
        [sm.totalQuestions, sm.attempted, sm.correct, sm.incorrect, sm.unattempted, sm.totalMarks, sm.negativeMarks, sm.obtainedMarks, sm.percentage],
        [10, 8, 6, 2, 2, 20, 1, 11, 55],
      );

      // duplicate submission prevented
      const again = await request(app).post(`/api/public/attempts/${attemptId}/submit`).set('X-Attempt-Token', accessToken).send({});
      assert.equal(again.status, 409);
      // answers can no longer be changed
      const late = await request(app).put(`/api/public/attempts/${attemptId}/answers`).set('X-Attempt-Token', accessToken).send({ answers: {} });
      assert.equal(late.status, 409);

      // own result via token, with review + explanations
      const res = await request(app).get(`/api/public/results/${sub.body.resultToken}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.studentName, 'Ravi Kumar');
      assert.equal(res.body.review.length, 10);
      assert.equal(res.body.review[0].status, 'correct');
      assert.equal(res.body.review[6].status, 'incorrect');
      assert.equal(res.body.review[9].status, 'unattempted');
      assert.match(res.body.review[0].explanation, /Explanation for question 1/);

      // lost result token can be re-issued with the attempt credentials
      const re = await request(app).post(`/api/public/attempts/${attemptId}/result-token`).set('X-Attempt-Token', accessToken);
      assert.equal(re.status, 200);
      assert.equal((await request(app).get(`/api/public/results/${re.body.resultToken}`)).status, 200);
    });

    test('unauthorized result access is blocked', async () => {
      const forged = `${quiz.id}.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`;
      assert.equal((await request(app).get(`/api/public/results/${forged}`)).status, 404);
      assert.equal((await request(app).get('/api/public/results/../../admin')).status, 404);
      assert.equal((await request(app).get(`/api/admin/quizzes/${quiz.id}/results`)).status, 401);
    });

    test('attempt limit is enforced on the backend', async () => {
      const name = 'Limit Tester';
      assert.equal((await startAttempt(quiz.slug, name, 'L1')).status, 201);
      assert.equal((await startAttempt(quiz.slug, ' limit   tester ', 'l1')).status, 201);
      const third = await startAttempt(quiz.slug, name, 'L1');
      assert.equal(third.status, 403);
      assert.equal(third.body.error.code, 'ATTEMPT_LIMIT_REACHED');
    });

    test('timer expiry: server rejects late answers and auto-submits', async () => {
      const s = await startAttempt(quiz.slug, 'Slow Student');
      const { attemptId, accessToken } = s.body;
      await request(app)
        .put(`/api/public/attempts/${attemptId}/answers`)
        .set('X-Attempt-Token', accessToken)
        .send({ answers: { [questions[0].id]: questions[0].correct_answer } });

      clock.advanceClock(11 * 60 * 1000); // past 10 min + 30 s grace
      try {
        const late = await request(app)
          .put(`/api/public/attempts/${attemptId}/answers`)
          .set('X-Attempt-Token', accessToken)
          .send({ answers: { [questions[1].id]: questions[1].correct_answer } });
        assert.equal(late.status, 410);

        // late submit: extra answers are ignored, only pre-deadline answers count
        const sub = await request(app)
          .post(`/api/public/attempts/${attemptId}/submit`)
          .set('X-Attempt-Token', accessToken)
          .send({ answers: { [questions[2].id]: questions[2].correct_answer } });
        assert.equal(sub.status, 200);
        assert.equal(sub.body.summary.correct, 1);
        assert.equal(sub.body.summary.attempted, 1);

        // abandoned attempts are auto-submitted when the admin opens results
        const s2 = await startAttempt(quiz.slug, 'Abandoned');
        assert.equal(s2.status, 201);
        clock.advanceClock(11 * 60 * 1000);
        const results = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);
        const row = results.body.results.find((r) => r.studentName === 'Abandoned');
        assert.ok(row);
        assert.equal(row.autoSubmitted, true);
        assert.equal(row.unattempted, 10);
        // timeTaken is capped at the duration
        assert.ok(row.timeTakenSeconds <= 600);
      } finally {
        clock.resetClock();
      }
    });

    test('admin results dashboard, individual result and CSV export', async () => {
      const r = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);
      assert.equal(r.status, 200);
      const { analytics, results, questionPerformance } = r.body;
      assert.ok(analytics.completedAttempts >= 3);
      assert.equal(analytics.highestScore, 11);
      assert.equal(questionPerformance.length, 10);
      assert.ok(questionPerformance[0].attempted >= 2);
      assert.equal(JSON.stringify(results).includes('resultTokenHash'), false);

      const one = await agent.get(`/api/admin/quizzes/${quiz.id}/results/${results[0].attemptId}`);
      assert.equal(one.status, 200);
      assert.equal(one.body.review.length, 10);

      const csv = await agent.get(`/api/admin/quizzes/${quiz.id}/results/export`);
      assert.equal(csv.status, 200);
      assert.match(csv.headers['content-type'], /text\/csv/);
      assert.match(csv.text, /Ravi Kumar/);
      assert.ok(csv.text.startsWith('﻿'));

      const all = await agent.get('/api/admin/results/export');
      assert.equal(all.status, 200);
      assert.match(all.text, /Student Name/);
    });

    test('concurrent students submitting at the same time', async () => {
      const starts = await Promise.all(Array.from({ length: 25 }, (_, i) => startAttempt(quiz.slug, `Student ${i}`)));
      assert.ok(starts.every((s) => s.status === 201));
      const numbers = starts.map((s) => s.body.attemptNumber);
      assert.equal(new Set(numbers).size, 25, 'attempt numbers must be unique');
      const subs = await Promise.all(
        starts.map((s) =>
          request(app)
            .post(`/api/public/attempts/${s.body.attemptId}/submit`)
            .set('X-Attempt-Token', s.body.accessToken)
            .send({ answers: { [questions[0].id]: questions[0].correct_answer } }),
        ),
      );
      assert.ok(subs.every((s) => s.status === 200));
      const r = await agent.get(`/api/admin/quizzes/${quiz.id}/results`);
      const names = r.body.results.map((x) => x.studentName);
      for (let i = 0; i < 25; i++) assert.ok(names.includes(`Student ${i}`));
    });

    test('closed quiz rejects new attempts', async () => {
      await agent.post(`/api/admin/quizzes/${quiz.id}/status`).set(H).send({ status: 'closed' });
      const r = await startAttempt(quiz.slug, 'Late Comer');
      assert.equal(r.status, 403);
      assert.equal(r.body.error.code, 'CLOSED');
      const info = await request(app).get(`/api/public/quizzes/${quiz.slug}`);
      assert.equal(info.body.availability.open, false);
      await publish(quiz.id);
    });

    test('availability window is validated on the server', async () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      const { quiz: q2 } = await createQuizWithQuestions(2, { startAt: future });
      await publish(q2.id);
      const r = await startAttempt(q2.slug);
      assert.equal(r.status, 403);
      assert.equal(r.body.error.code, 'NOT_STARTED');
    });
  });

  describe('backup and restore', () => {
    test('download backup, change data, restore', async () => {
      const b = await agent.get('/api/admin/backup');
      assert.equal(b.status, 200);
      const bundle = JSON.parse(b.text);
      assert.equal(bundle.format, 'quiz-platform-backup');
      assert.equal(JSON.stringify(bundle).includes('sessions'), false);
      const before = (await agent.get('/api/admin/quizzes')).body.quizzes.length;

      const extra = await agent.post('/api/admin/quizzes').set(H).send({ title: 'Will vanish', durationMinutes: 5, marksPerQuestion: 1 });
      assert.equal((await agent.get('/api/admin/quizzes')).body.quizzes.length, before + 1);

      const r = await agent.post('/api/admin/restore').set(H).send({ bundle });
      assert.equal(r.status, 200, JSON.stringify(r.body));
      const after = (await agent.get('/api/admin/quizzes')).body.quizzes;
      assert.equal(after.length, before);
      assert.ok(!after.some((q) => q.id === extra.body.quiz.id));

      // server-side backups list includes the automatic pre-restore snapshot
      const list = await agent.get('/api/admin/backups');
      assert.ok(list.body.backups.some((x) => x.name.includes('pre-restore')));
    });

    test('rejects invalid backup files', async () => {
      const r = await agent.post('/api/admin/restore').set(H).send({ bundle: { format: 'nope' } });
      assert.equal(r.status, 400);
      const evil = await agent.post('/api/admin/restore').set(H).send({
        bundle: { format: 'quiz-platform-backup', version: 1, createdAt: 'x', files: { 'quizzes.json': [], '../../etc/x.json': {} } },
      });
      assert.equal(evil.status, 400);
    });
  });
});
