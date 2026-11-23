import { z } from 'zod';
import crypto from 'node:crypto';
import config from '../config/index.js';
import { readJson, writeJson, updateJson, deletePath } from '../storage/jsonStorage.js';
import { AppError, randomToken, sha256, notFound, conflict, forbidden, round2, toCsv } from '../utils/helpers.js';
import { now } from '../utils/clock.js';
import {
  getQuizBySlug,
  getQuiz,
  getStoredQuestions,
  availability,
  publicQuizView,
  listQuizzes,
  QUIZ_ID_RE,
} from './quizService.js';
import { scoreAttempt } from './scoringService.js';
import { normalizeCode, formatCode } from './accessCodeService.js';
import { EMAIL_RE } from './quizService.js';

/*
 * Storage layout
 *   attempts/<quizId>/index.json          – small rows for every attempt (counting, listing)
 *   attempts/<quizId>/<attemptKey>.json   – one file per attempt (answers, review snapshot)
 *   results/<quizId>.json                 – one summary row per submitted attempt
 *   results/<quizId>.stats.json           – question-wise aggregate performance
 *
 * One file per attempt means students saving answers never contend for the same file.
 */

const ATTEMPT_ID_RE = /^([a-z0-9]{6,20})-([A-Za-z0-9_-]{16,64})$/;
const RESULT_TOKEN_RE = /^([a-z0-9]{6,20})\.([A-Za-z0-9_-]{16,64})$/;

const safeText = (max, msg) => z.string().trim().max(max, msg).refine((s) => !/[<>]/.test(s), 'Contains invalid characters.');
export const startSchema = z.object({
  // Required for "name"/"email" quizzes and for "code" quizzes whose code has no fixed name.
  studentName: safeText(100, 'Name is too long.').optional().default(''),
  studentId: safeText(50, 'Student ID is too long.').optional().default(''),
  email: z.string().trim().max(120).optional().default(''),
  code: z.string().trim().max(40).optional().default(''),
  // Random value made by the browser for one Start press. If the same request is sent twice
  // (slow network, automatic retry) the server returns the first attempt instead of a second one.
  startKey: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional(),
  // Random id stored in the student's browser; used to stop name-changing on the same device.
  deviceId: z.string().regex(/^[A-Za-z0-9_-]{16,64}$/).optional(),
});

export const answersSchema = z.object({
  answers: z.record(z.string().max(40), z.union([z.enum(['A', 'B', 'C', 'D']), z.null()])).optional().default({}),
  marked: z.array(z.string().max(40)).max(5000).optional(),
  // Set by the browser when its timer ran out. Only a label – it never affects scoring.
  auto: z.boolean().optional(),
});

function parseAttemptId(attemptId) {
  const m = typeof attemptId === 'string' && attemptId.match(ATTEMPT_ID_RE);
  if (!m) throw notFound('Attempt not found.');
  return { quizId: m[1], key: m[2] };
}

const attemptFile = (quizId, attemptId) => `attempts/${quizId}/${attemptId}.json`;
const indexFile = (quizId) => `attempts/${quizId}/index.json`;
const resultsFile = (quizId) => `results/${quizId}.json`;
const statsFile = (quizId) => `results/${quizId}.stats.json`;

const studentKey = (name, id) =>
  `${String(name).trim().toLowerCase().replace(/\s+/g, ' ')}|${String(id || '').trim().toLowerCase()}`;
const fieldError = (path, message) => new AppError(400, 'BAD_REQUEST', message, [{ path, message }]);

function deadlineMs(attempt) {
  return new Date(attempt.deadline).getTime();
}

function graceExpired(attempt) {
  return now() > deadlineMs(attempt) + config.submitGraceSeconds * 1000;
}

function timingSafeEqualStr(a, b) {
  const ba = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

async function loadAttempt(attemptId, token) {
  const { quizId } = parseAttemptId(attemptId);
  const attempt = await readJson(attemptFile(quizId, attemptId), null);
  if (!attempt) throw notFound('Attempt not found.');
  if (!token || !timingSafeEqualStr(sha256(String(token)), attempt.tokenHash)) {
    throw forbidden('You do not have access to this attempt.');
  }
  return attempt;
}

/* ---------------- Public: start ---------------- */

export async function startAttempt(slug, body) {
  const quiz = await getQuizBySlug(slug);
  const av = availability(quiz);
  if (!av.open) throw new AppError(av.reason === 'NOT_FOUND' ? 404 : 403, av.reason, av.message);

  const { questions } = await getStoredQuestions(quiz.id);
  if (!questions.length) throw new AppError(403, 'NO_QUESTIONS', 'This quiz has no questions yet.');

  // ---- Who is this student? ----
  const mode = quiz.accessMode || 'name';
  let studentName = body.studentName.trim();
  let studentId = body.studentId.trim();
  let email = '';
  let accessCode = '';
  let key;
  if (mode === 'code') {
    accessCode = normalizeCode(body.code);
    if (!accessCode) throw fieldError('code', 'Please enter your access code.');
    const entry = (quiz.accessCodes || []).find((c) => c.code === accessCode);
    if (!entry) throw new AppError(403, 'INVALID_CODE', 'This access code is not valid. Check it with your teacher.');
    if (entry.label) studentName = entry.label;
    key = `code|${accessCode}`;
  } else if (mode === 'email') {
    email = body.email.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) throw fieldError('email', 'Please enter a valid email address.');
    const allowed = quiz.allowedEmails || [];
    if (allowed.length && !allowed.includes(email)) {
      throw new AppError(403, 'EMAIL_NOT_ALLOWED', 'This email address is not on the list for this quiz. Use the email your teacher has.');
    }
    key = `email|${email}`;
  } else {
    key = studentKey(studentName, studentId);
  }
  if (studentName.length < 2) throw fieldError('studentName', 'Please enter your name (at least 2 characters).');

  const useDevice = mode !== 'code' && quiz.lockDevice !== false && Boolean(quiz.maxAttempts) && Boolean(body.deviceId);
  const deviceHash = body.deviceId ? sha256(`${quiz.id}:${body.deviceId}`) : '';
  const startKeyHash = body.startKey ? sha256(`${quiz.id}:${body.startKey}`) : '';

  const attemptId = `${quiz.id}-${randomToken(18)}`;
  const accessToken = randomToken(24);
  const startedAt = now();
  let deadline = startedAt + quiz.durationMinutes * 60 * 1000;
  if (quiz.endAt) deadline = Math.min(deadline, new Date(quiz.endAt).getTime());

  let resumed = null; // existing index row when this request repeats an earlier one
  const attemptNumber = await updateJson(indexFile(quiz.id), { attempts: [] }, (index, ctx) => {
    // 1) Same Start press sent twice -> hand back the first attempt (no duplicate, no limit error).
    const twin = startKeyHash && index.attempts.find((a) => a.startKeyHash === startKeyHash && a.status === 'in_progress');
    if (twin) {
      resumed = twin;
      ctx.skipWrite = true;
      return;
    }
    if (quiz.maxAttempts) {
      const mine = index.attempts.filter((a) => a.studentKey === key || (useDevice && a.deviceHash === deviceHash));
      if (mine.length >= quiz.maxAttempts) {
        // 2) Code holders may continue an unfinished attempt (lost phone, cleared browser). The code is the secret.
        const open = mode === 'code' && mine.find((a) => a.status === 'in_progress' && new Date(a.deadline).getTime() > startedAt);
        if (open) {
          resumed = open;
          ctx.skipWrite = true;
          return;
        }
        const sameDevice = useDevice && !mine.some((a) => a.studentKey === key);
        throw new AppError(
          403,
          'ATTEMPT_LIMIT_REACHED',
          sameDevice
            ? `An attempt for this quiz was already made from this device. If you are a different student, ask your teacher for your own access.`
            : `You have already used the maximum number of attempts (${quiz.maxAttempts}) for this quiz. If your internet dropped while starting, ask your teacher to reset your attempt.`,
        );
      }
    }
    const n = index.attempts.length + 1;
    index.attempts.push({
      attemptId,
      attemptNumber: n,
      studentName,
      studentId,
      email,
      accessCode,
      studentKey: key,
      deviceHash,
      startKeyHash,
      status: 'in_progress',
      startedAt: new Date(startedAt).toISOString(),
      deadline: new Date(deadline).toISOString(),
      submittedAt: null,
    });
    ctx.result = n;
  });

  if (resumed) {
    // Give the returning browser a fresh secret for the existing attempt.
    const file = attemptFile(quiz.id, resumed.attemptId);
    let ok = false;
    await updateJson(file, null, (a, ctx) => {
      if (!a || a.status !== 'in_progress') {
        ctx.skipWrite = true;
        return;
      }
      a.tokenHash = sha256(accessToken);
      ok = true;
    }, { backup: false });
    if (!ok) {
      const existing = await readJson(file, null);
      if (existing) throw conflict('This attempt was already submitted.');
      // The first request stopped between "reserve" and "create": rebuild the attempt file.
      await writeJson(file, buildAttempt({ quiz, questions, row: resumed, tokenHash: sha256(accessToken) }));
    }
    return { attemptId: resumed.attemptId, accessToken, attemptNumber: resumed.attemptNumber, resumed: true };
  }

  const row = {
    attemptId, attemptNumber, studentName, studentId, email, accessCode, studentKey: key,
    startedAt: new Date(startedAt).toISOString(), deadline: new Date(deadline).toISOString(),
  };
  await writeJson(attemptFile(quiz.id, attemptId), buildAttempt({ quiz, questions, row, tokenHash: sha256(accessToken) }));
  return { attemptId, accessToken, attemptNumber };
}

function buildAttempt({ quiz, questions, row, tokenHash }) {
  return {
    attemptId: row.attemptId,
    tokenHash,
    quizId: quiz.id,
    attemptNumber: row.attemptNumber,
    studentName: row.studentName,
    studentId: row.studentId,
    email: row.email || '',
    accessCode: row.accessCode || '',
    studentKey: row.studentKey,
    status: 'in_progress',
    startedAt: row.startedAt,
    deadline: row.deadline,
    questionIds: questions.map((q) => q.id),
    answers: {},
    marked: [],
    lastSavedAt: null,
    submittedAt: null,
    autoSubmitted: false,
    review: null,
    summary: null,
    resultTokenHash: null,
  };
}

/* ---------------- Public: fetch / save ---------------- */

export async function getAttemptForStudent(attemptId, token) {
  let attempt = await loadAttempt(attemptId, token);
  if (attempt.status === 'in_progress' && graceExpired(attempt)) {
    await finalizeAttempt(attempt.quizId, attemptId, { auto: true });
    attempt = await loadAttempt(attemptId, token);
  }
  const quiz = await getQuiz(attempt.quizId);
  if (attempt.status === 'submitted') {
    return { status: 'submitted', attemptId, submittedAt: attempt.submittedAt };
  }
  const { questions } = await getStoredQuestions(attempt.quizId);
  const map = new Map(questions.map((q) => [q.id, q]));
  return {
    status: 'in_progress',
    attemptId,
    attemptNumber: attempt.attemptNumber,
    studentName: attempt.studentName,
    studentId: attempt.studentId,
    quiz: publicQuizView(quiz),
    startedAt: attempt.startedAt,
    deadline: attempt.deadline,
    serverNow: new Date(now()).toISOString(),
    remainingSeconds: Math.max(0, Math.floor((deadlineMs(attempt) - now()) / 1000)),
    // NEVER include correct_answer or explanation here.
    questions: attempt.questionIds.map((id, i) => {
      const q = map.get(id);
      return {
        id,
        n: i + 1,
        type: q?.type === 'tf' ? 'tf' : 'mcq',
        question: q ? q.question : '(This question was removed.)',
        options: q ? (q.type === 'tf' ? { A: q.options.A, B: q.options.B } : { A: q.options.A, B: q.options.B, C: q.options.C, D: q.options.D }) : { A: '', B: '', C: '', D: '' },
      };
    }),
    answers: attempt.answers,
    marked: attempt.marked,
  };
}

export async function saveAnswers(attemptId, token, body) {
  const { quizId } = parseAttemptId(attemptId);
  await loadAttempt(attemptId, token); // auth check
  return updateJson(attemptFile(quizId, attemptId), null, (attempt, ctx) => {
    if (attempt.status !== 'in_progress') throw conflict('This attempt has already been submitted.');
    if (graceExpired(attempt)) {
      throw new AppError(410, 'TIME_UP', 'Time is up. Your answers saved before the deadline will be submitted.');
    }
    const allowed = new Set(attempt.questionIds);
    for (const [qid, letter] of Object.entries(body.answers || {})) {
      if (!allowed.has(qid)) continue;
      if (letter) attempt.answers[qid] = letter;
      else delete attempt.answers[qid];
    }
    if (Array.isArray(body.marked)) {
      attempt.marked = [...new Set(body.marked.filter((id) => allowed.has(id)))];
    }
    attempt.lastSavedAt = new Date(now()).toISOString();
    ctx.result = {
      saved: true,
      answeredCount: Object.keys(attempt.answers).length,
      remainingSeconds: Math.max(0, Math.floor((deadlineMs(attempt) - now()) / 1000)),
    };
  }, { backup: false });
}

/* ---------------- Submit / finalize ---------------- */

/**
 * Score and close an attempt. Idempotent: a second call returns the original
 * result instead of creating a duplicate submission.
 */
async function finalizeAttempt(quizId, attemptId, { auto = false, finalAnswers = null } = {}) {
  const quiz = await getQuiz(quizId);
  const { questions } = await getStoredQuestions(quizId);
  const qmap = new Map(questions.map((q) => [q.id, q]));
  let resultToken = null;
  let created = null;

  await updateJson(attemptFile(quizId, attemptId), null, (attempt, ctx) => {
    if (!attempt) throw notFound('Attempt not found.');
    if (attempt.status === 'submitted') {
      ctx.skipWrite = true;
      return;
    }
    // Late answers (after deadline + grace) are ignored – the server clock decides.
    if (finalAnswers && !graceExpired(attempt)) {
      const allowed = new Set(attempt.questionIds);
      for (const [qid, letter] of Object.entries(finalAnswers.answers || {})) {
        if (!allowed.has(qid)) continue;
        if (letter) attempt.answers[qid] = letter;
        else delete attempt.answers[qid];
      }
      if (Array.isArray(finalAnswers.marked)) attempt.marked = finalAnswers.marked.filter((id) => allowed.has(id));
    }
    const submittedAtMs = Math.min(now(), deadlineMs(attempt));
    const { summary, review } = scoreAttempt(quiz, attempt.questionIds, qmap, attempt.answers);
    resultToken = `${quizId}.${randomToken(24)}`;
    attempt.status = 'submitted';
    attempt.submittedAt = new Date(now()).toISOString();
    attempt.autoSubmitted = auto || now() > deadlineMs(attempt);
    attempt.timeTakenSeconds = Math.max(0, Math.round((submittedAtMs - new Date(attempt.startedAt).getTime()) / 1000));
    attempt.summary = summary;
    attempt.review = review;
    attempt.resultTokenHash = sha256(resultToken);
    created = attempt;
  }, { backup: false });

  if (!created) return { alreadySubmitted: true };

  const row = {
    attemptId,
    attemptNumber: created.attemptNumber,
    studentName: created.studentName,
    studentId: created.studentId,
    email: created.email || '',
    accessCode: created.accessCode || '',
    ...created.summary,
    timeTakenSeconds: created.timeTakenSeconds,
    startedAt: created.startedAt,
    submittedAt: created.submittedAt,
    autoSubmitted: created.autoSubmitted,
    resultTokenHash: created.resultTokenHash,
  };
  await updateJson(resultsFile(quizId), { quizId, results: [] }, (file) => {
    if (!file.results.some((r) => r.attemptId === attemptId)) file.results.push(row);
  });
  await updateJson(statsFile(quizId), { quizId, submissions: 0, questions: {} }, (stats) => {
    stats.submissions += 1;
    for (const [qid, [sel, cor]] of Object.entries(created.review)) {
      const s = (stats.questions[qid] ||= { attempted: 0, correct: 0, A: 0, B: 0, C: 0, D: 0 });
      if (sel) {
        s.attempted++;
        s[sel] = (s[sel] || 0) + 1;
        if (sel === cor) s.correct++;
      }
    }
  });
  await updateJson(indexFile(quizId), { attempts: [] }, (index) => {
    const r = index.attempts.find((a) => a.attemptId === attemptId);
    if (r) {
      r.status = 'submitted';
      r.submittedAt = created.submittedAt;
    }
  });
  return { resultToken, summary: created.summary };
}

export async function submitAttempt(attemptId, token, body) {
  const attempt = await loadAttempt(attemptId, token);
  if (attempt.status === 'submitted') {
    throw conflict('This attempt was already submitted.', { alreadySubmitted: true });
  }
  const out = await finalizeAttempt(attempt.quizId, attemptId, { finalAnswers: body, auto: body.auto === true });
  if (out.alreadySubmitted) throw conflict('This attempt was already submitted.', { alreadySubmitted: true });
  return out;
}

/**
 * Students who lost their result token (e.g. a network error during submit)
 * can obtain a fresh one using the attempt credentials.
 */
export async function reissueResultToken(attemptId, token) {
  const attempt = await loadAttempt(attemptId, token);
  if (attempt.status !== 'submitted') throw conflict('This attempt has not been submitted yet.');
  const resultToken = `${attempt.quizId}.${randomToken(24)}`;
  const hash = sha256(resultToken);
  await updateJson(attemptFile(attempt.quizId, attemptId), null, (a) => {
    a.resultTokenHash = hash;
  }, { backup: false });
  await updateJson(resultsFile(attempt.quizId), { quizId: attempt.quizId, results: [] }, (file) => {
    const r = file.results.find((x) => x.attemptId === attemptId);
    if (r) r.resultTokenHash = hash;
  });
  return { resultToken };
}

/** Auto-submit attempts whose time ran out (students who closed the tab). */
export async function finalizeExpiredAttempts(quizId) {
  const index = await readJson(indexFile(quizId), { attempts: [] });
  let count = 0;
  for (const a of index.attempts) {
    if (a.status !== 'in_progress') continue;
    if (now() > new Date(a.deadline).getTime() + config.submitGraceSeconds * 1000) {
      await finalizeAttempt(quizId, a.attemptId, { auto: true });
      count++;
    }
  }
  return count;
}

/* ---------------- Detailed result ---------------- */

async function buildDetailedResult(attempt, { forAdmin = false } = {}) {
  const quiz = await getQuiz(attempt.quizId);
  const { questions } = await getStoredQuestions(attempt.quizId);
  const map = new Map(questions.map((q) => [q.id, q]));
  const review = attempt.questionIds.map((id, i) => {
    const q = map.get(id);
    const [selected, correct] = attempt.review?.[id] || [attempt.answers?.[id] || null, q?.correct_answer || null];
    return {
      n: i + 1,
      id,
      type: q?.type === 'tf' ? 'tf' : 'mcq',
      question: q ? q.question : '(This question was removed after the attempt.)',
      options: q ? q.options : { A: '', B: '', C: '', D: '' },
      selected,
      correct,
      status: !selected ? 'unattempted' : selected === correct ? 'correct' : 'incorrect',
      explanation: q?.explanation || '',
      topic: q?.topic || '',
    };
  });
  const out = {
    quiz: { title: quiz.title, slug: quiz.slug, marksPerQuestion: quiz.marksPerQuestion, negativeMarking: quiz.negativeMarking, negativeMarks: quiz.negativeMarks },
    studentName: attempt.studentName,
    studentId: attempt.studentId,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    timeTakenSeconds: attempt.timeTakenSeconds,
    autoSubmitted: attempt.autoSubmitted,
    summary: attempt.summary,
    review,
  };
  if (forAdmin) out.attemptId = attempt.attemptId;
  return out;
}

export async function getResultByToken(resultToken) {
  const m = typeof resultToken === 'string' && resultToken.match(RESULT_TOKEN_RE);
  if (!m) throw notFound('Result not found.');
  const quizId = m[1];
  const file = await readJson(resultsFile(quizId), { results: [] });
  const hash = sha256(resultToken);
  const row = file.results.find((r) => r.resultTokenHash && timingSafeEqualStr(r.resultTokenHash, hash));
  if (!row) throw notFound('Result not found.');
  const attempt = await readJson(attemptFile(quizId, row.attemptId), null);
  if (!attempt || attempt.status !== 'submitted') throw notFound('Result not found.');
  return buildDetailedResult(attempt);
}

/* ---------------- Admin ---------------- */

const publicRow = ({ resultTokenHash, ...rest }) => rest; // eslint-disable-line no-unused-vars

export async function getQuizResultsForAdmin(quizId) {
  const quiz = await getQuiz(quizId);
  await finalizeExpiredAttempts(quizId);
  const [{ results }, index, stats, { questions }] = await Promise.all([
    readJson(resultsFile(quizId), { results: [] }),
    readJson(indexFile(quizId), { attempts: [] }),
    readJson(statsFile(quizId), { submissions: 0, questions: {} }),
    getStoredQuestions(quizId),
  ]);
  const rows = results.map(publicRow).sort((a, b) => a.attemptNumber - b.attemptNumber);
  const scores = rows.map((r) => r.obtainedMarks);
  const pct = rows.map((r) => r.percentage);
  const avg = (arr) => (arr.length ? round2(arr.reduce((s, x) => s + x, 0) / arr.length) : 0);

  const questionPerformance = questions.map((q, i) => {
    const s = stats.questions[q.id] || { attempted: 0, correct: 0, A: 0, B: 0, C: 0, D: 0 };
    return {
      n: i + 1,
      id: q.id,
      question_no: q.question_no,
      type: q.type === 'tf' ? 'tf' : 'mcq',
      question: q.question.length > 160 ? `${q.question.slice(0, 160)}…` : q.question,
      correct_answer: q.correct_answer,
      attempted: s.attempted,
      correct: s.correct,
      incorrect: s.attempted - s.correct,
      unattempted: Math.max(0, stats.submissions - s.attempted),
      accuracy: s.attempted ? round2((s.correct / s.attempted) * 100) : 0,
      distribution: { A: s.A || 0, B: s.B || 0, C: s.C || 0, D: s.D || 0 },
    };
  });

  return {
    quiz: { id: quiz.id, title: quiz.title, slug: quiz.slug, status: quiz.status, questionCount: quiz.questionCount, totalMarks: round2(quiz.questionCount * quiz.marksPerQuestion) },
    analytics: {
      totalAttempts: index.attempts.length,
      completedAttempts: rows.length,
      inProgressAttempts: index.attempts.filter((a) => a.status === 'in_progress').length,
      averageScore: avg(scores),
      highestScore: scores.length ? Math.max(...scores) : 0,
      lowestScore: scores.length ? Math.min(...scores) : 0,
      averagePercentage: avg(pct),
    },
    results: rows,
    // Started but not submitted yet (or abandoned): the admin can remove them to free a student's slot.
    inProgress: index.attempts
      .filter((a) => a.status === 'in_progress')
      .map((a) => ({ attemptId: a.attemptId, attemptNumber: a.attemptNumber, studentName: a.studentName, studentId: a.studentId, email: a.email || '', accessCode: a.accessCode ? formatCode(a.accessCode) : '', startedAt: a.startedAt, deadline: a.deadline })),
    questionPerformance,
  };
}

/** Remove one attempt completely (also from the totals) so the student can try again. */
export async function deleteAttempt(quizId, attemptId) {
  const parsed = parseAttemptId(attemptId);
  if (parsed.quizId !== quizId) throw notFound('Attempt not found.');
  await getQuiz(quizId);
  const attempt = await readJson(attemptFile(quizId, attemptId), null);
  let found = false;
  await updateJson(indexFile(quizId), { attempts: [] }, (index) => {
    const i = index.attempts.findIndex((a) => a.attemptId === attemptId);
    if (i !== -1) {
      index.attempts.splice(i, 1);
      found = true;
    }
  });
  if (!found && !attempt) throw notFound('Attempt not found.');
  await updateJson(resultsFile(quizId), { quizId, results: [] }, (file) => {
    file.results = file.results.filter((r) => r.attemptId !== attemptId);
  });
  if (attempt?.status === 'submitted' && attempt.review) {
    await updateJson(statsFile(quizId), { quizId, submissions: 0, questions: {} }, (stats) => {
      stats.submissions = Math.max(0, stats.submissions - 1);
      for (const [qid, [sel, cor]] of Object.entries(attempt.review)) {
        const q = stats.questions[qid];
        if (!q || !sel) continue;
        q.attempted = Math.max(0, q.attempted - 1);
        q[sel] = Math.max(0, (q[sel] || 0) - 1);
        if (sel === cor) q.correct = Math.max(0, q.correct - 1);
      }
    });
  }
  await deletePath(attemptFile(quizId, attemptId));
  return { ok: true };
}

export async function getAttemptResultForAdmin(quizId, attemptId) {
  const parsed = parseAttemptId(attemptId);
  if (parsed.quizId !== quizId) throw notFound('Attempt not found.');
  const attempt = await readJson(attemptFile(quizId, attemptId), null);
  if (!attempt) throw notFound('Attempt not found.');
  if (attempt.status !== 'submitted') {
    return { status: 'in_progress', studentName: attempt.studentName, startedAt: attempt.startedAt, deadline: attempt.deadline, answeredCount: Object.keys(attempt.answers).length };
  }
  return { status: 'submitted', ...(await buildDetailedResult(attempt, { forAdmin: true })) };
}

const CSV_HEADERS = [
  'Quiz', 'Attempt Number', 'Student Name', 'Student ID', 'Email', 'Access Code', 'Obtained Marks', 'Total Marks', 'Percentage',
  'Correct', 'Incorrect', 'Unattempted', 'Attempted', 'Negative Marks', 'Time Taken (s)', 'Started At',
  'Submitted At', 'Auto Submitted',
];

function csvRow(quiz, r) {
  return [
    quiz.title, r.attemptNumber, r.studentName, r.studentId, r.email || '', r.accessCode ? formatCode(r.accessCode) : '', r.obtainedMarks, r.totalMarks, r.percentage,
    r.correct, r.incorrect, r.unattempted, r.attempted, r.negativeMarks, r.timeTakenSeconds, r.startedAt,
    r.submittedAt, r.autoSubmitted ? 'Yes' : 'No',
  ];
}

export async function exportQuizResultsCsv(quizId) {
  const quiz = await getQuiz(quizId);
  await finalizeExpiredAttempts(quizId);
  const { results } = await readJson(resultsFile(quizId), { results: [] });
  const rows = results.sort((a, b) => a.attemptNumber - b.attemptNumber).map((r) => csvRow(quiz, r));
  return { filename: `${quiz.slug}-results.csv`, csv: toCsv(CSV_HEADERS, rows) };
}

export async function exportAllResultsCsv() {
  const quizzes = await listQuizzes();
  const rows = [];
  for (const quiz of quizzes) {
    if (!QUIZ_ID_RE.test(quiz.id)) continue;
    await finalizeExpiredAttempts(quiz.id);
    const { results } = await readJson(resultsFile(quiz.id), { results: [] });
    for (const r of results.sort((a, b) => a.attemptNumber - b.attemptNumber)) rows.push(csvRow(quiz, r));
  }
  return { filename: `all-results-${new Date().toISOString().slice(0, 10)}.csv`, csv: toCsv(CSV_HEADERS, rows) };
}

export async function resultCounts() {
  const quizzes = await listQuizzes();
  const out = {};
  for (const q of quizzes) {
    const idx = await readJson(indexFile(q.id), { attempts: [] });
    out[q.id] = {
      attempts: idx.attempts.length,
      submitted: idx.attempts.filter((a) => a.status === 'submitted').length,
    };
  }
  return out;
}
