import { z } from 'zod';
import { readJson, writeJson, updateJson, deletePath, listJsonFiles } from '../storage/jsonStorage.js';
import { shortId, slugify, notFound, badRequest, conflict } from '../utils/helpers.js';
import { nowIso, now } from '../utils/clock.js';
import { validateQuestions, toStoredQuestion, strictQuestionSchema } from './questionValidator.js';

export const QUIZ_STATUSES = ['draft', 'published', 'closed', 'archived'];
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const QUIZ_ID_RE = /^[a-z0-9]{6,20}$/;
/** O Level module codes a quiz can be tagged with (optional). */
export const QUIZ_MODULES = ['m1-r5', 'm2-r5', 'm3-r5', 'm4-r5'];
/** How students identify themselves: free name (+ID), e-mail, or a personal access code. */
export const ACCESS_MODES = ['name', 'email', 'code'];
export const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/;
const optEmails = z
  .union([z.array(z.string()).max(3000), z.string().max(200000), z.null()])
  .optional()
  .transform((v) => {
    if (v === undefined) return undefined;
    const list = Array.isArray(v) ? v : String(v || '').split(/[\s,;]+/);
    return [...new Set(list.map((x) => String(x).trim().toLowerCase()).filter((x) => EMAIL_RE.test(x)))].slice(0, 3000);
  });
const optAccessMode = z.enum(ACCESS_MODES).optional();
const optBool = z.boolean().optional();

const optText = (max) =>
  z.union([z.string().trim().max(max), z.null()]).optional().transform((v) => (v === undefined ? undefined : v || null));
const optModule = z
  .union([z.enum(QUIZ_MODULES), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v || null));
const optYear = z
  .union([z.coerce.number().int().min(2000).max(2100), z.literal(''), z.null()])
  .optional()
  .transform((v) => (v === undefined ? undefined : v === '' ? null : v));

const isoOrNull = z
  .union([z.string().datetime({ offset: true }), z.null()])
  .optional()
  .transform((v) => v ?? null);

/** Fields the admin can set when creating/updating a quiz. */
export const quizInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.').max(200),
    description: z.string().max(5000).optional().default(''),
    instructions: z.string().max(10000).optional().default(''),
    durationMinutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute.').max(1440),
    marksPerQuestion: z.coerce.number().positive('Marks per question must be greater than 0.').max(1000),
    negativeMarking: z.boolean().optional().default(false),
    negativeMarks: z.coerce.number().min(0).max(1000).optional().default(0),
    maxAttempts: z.union([z.coerce.number().int().min(1).max(1000), z.null()]).optional().default(null),
    startAt: isoOrNull,
    endAt: isoOrNull,
    accessMode: optAccessMode,
    lockDevice: optBool,
    allowedEmails: optEmails,
    module: optModule,
    topic: optText(120),
    year: optYear,
    seoTitle: optText(120),
    seoDescription: optText(300),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .max(80)
      .regex(SLUG_RE, 'Slug may contain lowercase letters, numbers and single hyphens only.')
      .optional()
      .or(z.literal('').transform(() => undefined)),
  })
  .superRefine((v, ctx) => {
    if (v.startAt && v.endAt && new Date(v.endAt) <= new Date(v.startAt)) {
      ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'End date must be after the start date.' });
    }
  });

export const quizUpdateSchema = quizInputSchema; // full replace of editable fields

export const quizMetaSchema = z.object({
  id: z.string().regex(QUIZ_ID_RE),
  slug: z.string().regex(SLUG_RE),
  title: z.string(),
  description: z.string(),
  instructions: z.string(),
  durationMinutes: z.number().int().positive(),
  marksPerQuestion: z.number().positive(),
  negativeMarking: z.boolean(),
  negativeMarks: z.number().min(0),
  maxAttempts: z.number().int().positive().nullable(),
  startAt: z.string().nullable(),
  endAt: z.string().nullable(),
  status: z.enum(QUIZ_STATUSES),
  questionCount: z.number().int().min(0),
  invalidCount: z.number().int().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().nullable(),
  // Optional public-site fields (older quizzes do not have them).
  module: z.enum(QUIZ_MODULES).nullable().optional(),
  topic: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  // Student identification (older quizzes do not have these: they behave like accessMode "name").
  accessMode: z.enum(ACCESS_MODES).optional(),
  lockDevice: z.boolean().optional(),
  allowedEmails: z.array(z.string()).optional(),
  accessCodes: z.array(z.object({ code: z.string(), label: z.string(), createdAt: z.string() })).optional(),
});
const quizListSchema = z.array(quizMetaSchema);

const questionsFile = (id) => `questions/${id}.json`;

export function assertQuizId(id) {
  if (typeof id !== 'string' || !QUIZ_ID_RE.test(id)) throw notFound('Quiz not found.');
}

export async function listQuizzes() {
  return readJson('quizzes.json', []);
}

export async function getQuiz(id) {
  assertQuizId(id);
  const quiz = (await listQuizzes()).find((q) => q.id === id);
  if (!quiz) throw notFound('Quiz not found.');
  return quiz;
}

export async function getQuizBySlug(slug) {
  if (typeof slug !== 'string' || !SLUG_RE.test(slug)) return null;
  return (await listQuizzes()).find((q) => q.slug === slug) || null;
}

function uniqueSlug(base, quizzes, ownId) {
  let root = slugify(base) || `quiz-${shortId(6)}`;
  root = root.slice(0, 70).replace(/-+$/, '');
  const taken = new Set(quizzes.filter((q) => q.id !== ownId).map((q) => q.slug));
  if (!taken.has(root)) return root;
  for (let i = 2; i < 10000; i++) if (!taken.has(`${root}-${i}`)) return `${root}-${i}`;
  return `${root}-${shortId(6)}`;
}

export async function createQuiz(input) {
  const data = quizInputSchema.parse(input);
  const id = shortId(10);
  const ts = nowIso();
  let created;
  await updateJson('quizzes.json', [], (quizzes) => {
    if (data.slug && quizzes.some((q) => q.slug === data.slug)) {
      throw conflict(`The link "${data.slug}" is already used by another quiz.`);
    }
    created = {
      id,
      slug: data.slug || uniqueSlug(data.title, quizzes),
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      marksPerQuestion: data.marksPerQuestion,
      negativeMarking: data.negativeMarking,
      negativeMarks: data.negativeMarking ? data.negativeMarks : 0,
      maxAttempts: data.maxAttempts,
      startAt: data.startAt,
      endAt: data.endAt,
      accessMode: data.accessMode ?? 'name',
      lockDevice: data.lockDevice ?? true,
      allowedEmails: data.allowedEmails ?? [],
      accessCodes: [],
      module: data.module ?? null,
      topic: data.topic ?? null,
      year: data.year ?? null,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      status: 'draft',
      questionCount: 0,
      invalidCount: 0,
      createdAt: ts,
      updatedAt: ts,
      publishedAt: null,
    };
    quizzes.push(created);
  }, { schema: quizListSchema });
  await writeJson(questionsFile(id), { quizId: id, updatedAt: ts, questions: [] });
  return created;
}

export async function updateQuiz(id, input) {
  assertQuizId(id);
  const data = quizUpdateSchema.parse(input);
  return updateJson('quizzes.json', [], (quizzes, ctx) => {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) throw notFound('Quiz not found.');
    if (data.slug && data.slug !== quiz.slug) {
      if (quizzes.some((q) => q.slug === data.slug && q.id !== id)) {
        throw conflict(`The link "${data.slug}" is already used by another quiz.`);
      }
      quiz.slug = data.slug;
    }
    Object.assign(quiz, {
      title: data.title,
      description: data.description,
      instructions: data.instructions,
      durationMinutes: data.durationMinutes,
      marksPerQuestion: data.marksPerQuestion,
      negativeMarking: data.negativeMarking,
      negativeMarks: data.negativeMarking ? data.negativeMarks : 0,
      maxAttempts: data.maxAttempts,
      startAt: data.startAt,
      endAt: data.endAt,
      // New optional fields: only touched when the client actually sent them.
      ...Object.fromEntries(
        ['module', 'topic', 'year', 'seoTitle', 'seoDescription', 'accessMode', 'lockDevice', 'allowedEmails'].filter((k) => data[k] !== undefined).map((k) => [k, data[k]]),
      ),
      updatedAt: nowIso(),
    });
    ctx.result = quiz;
  }, { schema: quizListSchema });
}

export async function setQuizStatus(id, status) {
  assertQuizId(id);
  if (!QUIZ_STATUSES.includes(status)) throw badRequest(`Invalid status "${status}".`);
  if (status === 'published') {
    const quiz = await getQuiz(id);
    const { stats, questions } = await getValidatedQuestions(id);
    const problems = [];
    if (!stats.total) problems.push('The quiz has no questions.');
    if (stats.invalid) problems.push(`${stats.invalid} question(s) are invalid. Fix or delete them before publishing.`);
    if (!quiz.title.trim()) problems.push('The quiz needs a title.');
    if (quiz.endAt && new Date(quiz.endAt).getTime() <= now()) problems.push('The availability end date is in the past.');
    // Defence in depth: every question must satisfy the strict schema.
    for (const q of questions) {
      if (!strictQuestionSchema.safeParse(toStoredQuestion(q)).success && q.valid) {
        problems.push(`Question at position ${q.position} failed strict validation.`);
      }
    }
    if (problems.length) throw conflict('Quiz cannot be published yet.', problems);
  }
  return updateJson('quizzes.json', [], (quizzes, ctx) => {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) throw notFound('Quiz not found.');
    quiz.status = status;
    quiz.updatedAt = nowIso();
    if (status === 'published') quiz.publishedAt = nowIso();
    ctx.result = quiz;
  }, { schema: quizListSchema });
}

export async function deleteQuiz(id) {
  assertQuizId(id);
  await updateJson('quizzes.json', [], (quizzes) => {
    const idx = quizzes.findIndex((q) => q.id === id);
    if (idx === -1) throw notFound('Quiz not found.');
    quizzes.splice(idx, 1);
  }, { schema: quizListSchema });
  await deletePath(questionsFile(id));
  await deletePath(`attempts/${id}`);
  await deletePath(`results/${id}.json`);
  await deletePath(`results/${id}.stats.json`);
}

export async function duplicateQuiz(id) {
  const src = await getQuiz(id);
  const { questions } = await getStoredQuestions(id);
  const copy = await createQuiz({
    title: `${src.title} (Copy)`,
    description: src.description,
    instructions: src.instructions,
    durationMinutes: src.durationMinutes,
    marksPerQuestion: src.marksPerQuestion,
    negativeMarking: src.negativeMarking,
    negativeMarks: src.negativeMarks,
    maxAttempts: src.maxAttempts,
    startAt: src.startAt,
    endAt: src.endAt,
    module: src.module ?? null,
    topic: src.topic ?? null,
    year: src.year ?? null,
    seoTitle: src.seoTitle ?? null,
    seoDescription: src.seoDescription ?? null,
    accessMode: src.accessMode ?? 'name',
    lockDevice: src.lockDevice ?? true,
    allowedEmails: src.allowedEmails ?? [],
  });
  await replaceQuestions(copy.id, questions.map((q) => ({ ...q, id: undefined })));
  return getQuiz(copy.id);
}

/* ---------------- Questions ---------------- */

export async function getStoredQuestions(id) {
  assertQuizId(id);
  return readJson(questionsFile(id), { quizId: id, updatedAt: null, questions: [] });
}

export async function getValidatedQuestions(id) {
  const { questions } = await getStoredQuestions(id);
  return validateQuestions(questions);
}

function assertEditable(quiz) {
  if (quiz.status === 'published') {
    throw conflict('Unpublish the quiz before editing its questions, so students in the middle of an attempt are not affected.');
  }
}

async function persistQuestions(id, list) {
  const result = validateQuestions(list, { assignIds: () => `q_${shortId(10)}` });
  const stored = result.questions.map(toStoredQuestion);
  await writeJson(questionsFile(id), { quizId: id, updatedAt: nowIso(), questions: stored });
  await updateJson('quizzes.json', [], (quizzes) => {
    const quiz = quizzes.find((q) => q.id === id);
    if (quiz) {
      quiz.questionCount = result.stats.total;
      quiz.invalidCount = result.stats.invalid;
      quiz.updatedAt = nowIso();
    }
  }, { schema: quizListSchema });
  return result;
}

/** Replace (mode = "replace") or append (mode = "append") the question list. */
export async function saveQuestions(id, list, mode = 'replace') {
  const quiz = await getQuiz(id);
  assertEditable(quiz);
  if (!Array.isArray(list)) throw badRequest('"questions" must be an array.');
  if (mode === 'append') {
    const { questions } = await getStoredQuestions(id);
    const fresh = list.map((q) => ({ ...q, id: undefined }));
    return persistQuestions(id, [...questions, ...fresh]);
  }
  // Keep ids sent by the editor only if they are well-formed and unique.
  const seen = new Set();
  const cleaned = list.map((q) => {
    const keep = typeof q?.id === 'string' && /^q_[a-z0-9]{6,20}$/.test(q.id) && !seen.has(q.id);
    if (keep) seen.add(q.id);
    return { ...q, id: keep ? q.id : undefined };
  });
  return persistQuestions(id, cleaned);
}

export async function replaceQuestions(id, list) {
  return persistQuestions(id, list);
}

export async function updateQuestion(id, questionId, patch) {
  const quiz = await getQuiz(id);
  assertEditable(quiz);
  const { questions } = await getStoredQuestions(id);
  const idx = questions.findIndex((q) => q.id === questionId);
  if (idx === -1) throw notFound('Question not found.');
  const merged = { ...questions[idx], ...patch, id: questionId };
  delete merged.parse_errors; // the admin has reviewed and edited this question
  if (patch.options) merged.options = { ...questions[idx].options, ...patch.options };
  questions[idx] = merged;
  const result = await persistQuestions(id, questions);
  return { question: result.questions[idx], stats: result.stats };
}

export async function deleteQuestion(id, questionId) {
  const quiz = await getQuiz(id);
  assertEditable(quiz);
  const { questions } = await getStoredQuestions(id);
  const next = questions.filter((q) => q.id !== questionId);
  if (next.length === questions.length) throw notFound('Question not found.');
  const result = await persistQuestions(id, next);
  return { stats: result.stats };
}

/** Public, answer-free view of a quiz for students. */
export function publicQuizView(quiz) {
  return {
    slug: quiz.slug,
    title: quiz.title,
    description: quiz.description,
    instructions: quiz.instructions,
    durationMinutes: quiz.durationMinutes,
    questionCount: quiz.questionCount,
    marksPerQuestion: quiz.marksPerQuestion,
    maxMarks: quiz.questionCount * quiz.marksPerQuestion,
    negativeMarking: quiz.negativeMarking,
    negativeMarks: quiz.negativeMarks,
    maxAttempts: isOpenPractice(quiz) ? null : quiz.maxAttempts,
    startAt: isOpenPractice(quiz) ? null : quiz.startAt,
    endAt: isOpenPractice(quiz) ? null : quiz.endAt,
    module: quiz.module ?? null,
    topic: quiz.topic ?? null,
    year: quiz.year ?? null,
    seoTitle: quiz.seoTitle ?? null,
    seoDescription: quiz.seoDescription ?? null,
    accessMode: quiz.accessMode || 'name',
    restrictedEmails: (quiz.allowedEmails || []).length > 0,
  };
}

/** Published quizzes for the public website list. Never includes drafts, answers or admin data. */
export async function listPublicQuizzes({ module } = {}) {
  const all = await listQuizzes();
  return all
    // Only quizzes the admin explicitly tagged with a module go on the public site.
    // Untagged quizzes (e.g. institute / private-link quizzes) are never listed.
    .filter((q) => q.status === 'published' && q.questionCount > 0 && q.module)
    .filter((q) => !module || q.module === module)
    .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
    .map((q) => ({
      slug: q.slug,
      title: q.title,
      description: q.description || '',
      module: q.module ?? null,
      topic: q.topic ?? null,
      year: q.year ?? null,
      questionCount: q.questionCount,
      durationMinutes: q.durationMinutes,
      publishedAt: q.publishedAt,
    }));
}

/**
 * A quiz with a Module is listed on the public practice site. Public practice has no attempt limit,
 * no device lock and no start/end window: anyone can take it as many times as they like.
 * Quizzes without a Module (the institute's private links) keep every limit exactly as configured.
 */
export const isOpenPractice = (quiz) => Boolean(quiz && quiz.module);

/** Is the quiz open for students right now? Returns { open, reason }. */
export function availability(quiz) {
  if (!quiz || quiz.status === 'draft' || quiz.status === 'archived') {
    return { open: false, reason: 'NOT_FOUND', message: 'This quiz does not exist or is not published.' };
  }
  if (quiz.status === 'closed') return { open: false, reason: 'CLOSED', message: 'This quiz has been closed by the organiser.' };
  if (isOpenPractice(quiz)) return { open: true };
  const t = now();
  if (quiz.startAt && t < new Date(quiz.startAt).getTime()) {
    return { open: false, reason: 'NOT_STARTED', message: 'This quiz has not started yet.' };
  }
  if (quiz.endAt && t >= new Date(quiz.endAt).getTime()) {
    return { open: false, reason: 'ENDED', message: 'This quiz is no longer accepting attempts.' };
  }
  return { open: true };
}

export async function quizStorageSummary() {
  const files = await listJsonFiles('questions');
  return { questionFiles: files.length };
}
