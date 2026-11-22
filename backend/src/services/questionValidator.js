import { z } from 'zod';
import { OPTION_KEYS } from './mcqParser.js';

/**
 * Canonical question JSON schema (what is stored and exported):
 * {
 *   "id": "optional-stable-id",
 *   "question_no": 1,
 *   "question": "What is the full form of CPU?",
 *   "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
 *   "correct_answer": "A",
 *   "explanation": "..."
 * }
 */

const MAX_TEXT = 10000;

// Structural (type) schema used for imported JSON. Lenient on content so that
// content problems are reported per question instead of rejecting the whole file.
export const importedQuestionSchema = z
  .object({
    id: z.string().max(64).optional(),
    question_no: z.union([z.number(), z.string()]).optional().nullable(),
    question: z.string().max(MAX_TEXT).optional().nullable(),
    options: z
      .union([
        z.record(z.string(), z.union([z.string().max(MAX_TEXT), z.null()])),
        z.array(z.union([z.string().max(MAX_TEXT), z.null()])).max(4),
      ])
      .optional()
      .nullable(),
    correct_answer: z.union([z.string().max(200), z.null()]).optional(),
    explanation: z.union([z.string().max(MAX_TEXT), z.null()]).optional(),
    topic: z.union([z.string().max(120), z.null()]).optional(),
  })
  .passthrough();

// Strict schema for a question that is ready to publish.
export const strictQuestionSchema = z.object({
  id: z.string().min(1).max(64),
  question_no: z.number().int().positive(),
  question: z.string().trim().min(1).max(MAX_TEXT),
  options: z.object({
    A: z.string().trim().min(1).max(MAX_TEXT),
    B: z.string().trim().min(1).max(MAX_TEXT),
    C: z.string().trim().min(1).max(MAX_TEXT),
    D: z.string().trim().min(1).max(MAX_TEXT),
  }),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().max(MAX_TEXT).optional().default(''),
  topic: z.string().max(120).optional().default(''),
});

const str = (v) => (v === null || v === undefined ? '' : String(v));

/**
 * Normalise any loosely-shaped question (parser output, JSON import, editor)
 * into the canonical shape. Keeps track of which option keys were absent so we
 * can say "missing" rather than "empty".
 */
export function normalizeQuestion(input, index = 0) {
  const q = input && typeof input === 'object' ? input : {};
  let options = q.options;
  if (Array.isArray(options)) {
    options = Object.fromEntries(options.map((t, i) => [OPTION_KEYS[i] || `X${i}`, t]));
  }
  options = options && typeof options === 'object' ? options : {};
  const upper = {};
  for (const [k, v] of Object.entries(options)) upper[String(k).trim().toUpperCase()] = v;

  const missingOptions = OPTION_KEYS.filter((k) => !(k in upper) || upper[k] === null);
  const extraOptions = Object.keys(upper).filter((k) => !OPTION_KEYS.includes(k));

  let qno = q.question_no;
  if (typeof qno === 'string' && /^\s*\d+\s*$/.test(qno)) qno = parseInt(qno, 10);
  if (typeof qno !== 'number' || !Number.isFinite(qno)) qno = null;

  return {
    id: typeof q.id === 'string' && q.id ? q.id : undefined,
    question_no: qno,
    question: str(q.question),
    options: {
      A: str(upper.A),
      B: str(upper.B),
      C: str(upper.C),
      D: str(upper.D),
    },
    correct_answer: str(q.correct_answer).trim().toUpperCase(),
    explanation: str(q.explanation),
    topic: str(q.topic).trim().slice(0, 120),
    _missingOptions: q._missingOptions ?? missingOptions,
    _extraOptions: extraOptions,
    // Parse problems travel either as raw parser output (parse_errors) or as the
    // MALFORMED_BLOCK errors of a previously validated question sent back unchanged.
    _parseErrors: Array.isArray(q.parse_errors)
      ? q.parse_errors.map(String)
      : Array.isArray(q.errors)
        ? q.errors.filter((e) => e?.code === 'MALFORMED_BLOCK').map((e) => String(e.message))
        : [],
    _warnings: Array.isArray(q.warnings) ? q.warnings : [],
    _sourceLine: q.source_line ?? null,
    _index: index,
  };
}

/** Validate one normalised question (without cross-question checks). */
function validateOne(q) {
  const errors = [];
  const add = (code, message) => errors.push({ code, message });

  if (!q.question.trim()) add('MISSING_QUESTION', 'Question text is missing.');
  if (q.question_no === null) add('MISSING_NUMBER', 'Question number is missing or not a number.');
  else if (!Number.isInteger(q.question_no) || q.question_no < 1) add('INVALID_NUMBER', 'Question number must be a positive whole number.');

  for (const k of OPTION_KEYS) {
    if (q._missingOptions.includes(k)) add(`MISSING_OPTION_${k}`, `Option ${k} is missing.`);
    else if (!q.options[k].trim()) add(`EMPTY_OPTION_${k}`, `Option ${k} is empty.`);
  }
  if (q._extraOptions.length) {
    add('EXTRA_OPTIONS', `Unsupported option(s): ${q._extraOptions.join(', ')}. Only A–D are allowed.`);
  }

  // Duplicate options (case/space-insensitive)
  const seen = new Map();
  for (const k of OPTION_KEYS) {
    const t = q.options[k].trim().replace(/\s+/g, ' ').toLowerCase();
    if (!t) continue;
    if (seen.has(t)) add('DUPLICATE_OPTIONS', `Options ${seen.get(t)} and ${k} have the same text.`);
    else seen.set(t, k);
  }

  if (!q.correct_answer) add('MISSING_ANSWER', 'Correct answer is missing.');
  else if (!OPTION_KEYS.includes(q.correct_answer)) {
    add('INVALID_ANSWER', `Invalid answer "${q.correct_answer}". The answer must be A, B, C or D.`);
  } else if (!q._missingOptions.includes(q.correct_answer) && !q.options[q.correct_answer].trim()) {
    add('ANSWER_POINTS_TO_EMPTY_OPTION', `The correct answer ${q.correct_answer} points to an empty option.`);
  }

  for (const pe of q._parseErrors) add('MALFORMED_BLOCK', pe);
  if (q.question.length > MAX_TEXT) add('TOO_LONG', 'Question text is too long.');
  return errors;
}

/**
 * Validate a list of questions. Returns every question (never silently drops any)
 * with its errors, plus summary statistics.
 */
export function validateQuestions(list, { assignIds } = {}) {
  const normalized = (Array.isArray(list) ? list : []).map((q, i) => normalizeQuestion(q, i));

  const numberCounts = new Map();
  for (const q of normalized) {
    if (q.question_no !== null) numberCounts.set(q.question_no, (numberCounts.get(q.question_no) || 0) + 1);
  }
  const duplicateNumbers = [...numberCounts.entries()].filter(([, c]) => c > 1).map(([n]) => n).sort((a, b) => a - b);
  const dupSet = new Set(duplicateNumbers);

  let missingAnswers = 0;
  const questions = normalized.map((q, i) => {
    const errors = validateOne(q);
    if (q.question_no !== null && dupSet.has(q.question_no)) {
      errors.push({ code: 'DUPLICATE_NUMBER', message: `Question number ${q.question_no} is used more than once.` });
    }
    if (errors.some((e) => e.code === 'MISSING_ANSWER')) missingAnswers++;
    const out = {
      id: q.id || (assignIds ? assignIds() : undefined),
      question_no: q.question_no,
      question: q.question,
      options: q.options,
      correct_answer: q.correct_answer,
      explanation: q.explanation,
      topic: q.topic,
      position: i + 1,
      source_line: q._sourceLine,
      valid: errors.length === 0,
      errors,
      warnings: q._warnings,
    };
    if (!out.id) delete out.id;
    return out;
  });

  const valid = questions.filter((q) => q.valid).length;
  return {
    questions,
    stats: {
      total: questions.length,
      valid,
      invalid: questions.length - valid,
      duplicateNumbers: duplicateNumbers.length,
      duplicateNumberList: duplicateNumbers,
      missingAnswers,
    },
  };
}

/** Strip validation metadata, producing the canonical stored/exported question. */
export function toStoredQuestion(q) {
  const out = {
    id: q.id,
    question_no: q.question_no,
    question: q.question,
    options: { A: q.options.A, B: q.options.B, C: q.options.C, D: q.options.D },
    correct_answer: q.correct_answer,
    explanation: q.explanation || '',
  };
  if (q.topic) out.topic = String(q.topic).trim().slice(0, 120);
  // Problems found while parsing the original text (e.g. "option B appears twice")
  // stay attached until the admin edits the question, so they keep blocking publishing.
  const pe = (q.errors || []).filter((e) => e.code === 'MALFORMED_BLOCK').map((e) => e.message);
  if (pe.length) out.parse_errors = pe;
  return out;
}

/**
 * Parse a JSON string/object that should contain questions. Accepts either an
 * array of questions, { questions: [...] }, or a full quiz export.
 */
export function extractQuestionsFromJson(input) {
  let data = input;
  if (typeof input === 'string') {
    try {
      data = JSON.parse(input.replace(/^﻿/, ''));
    } catch (e) {
      return { error: `Invalid JSON: ${e.message}` };
    }
  }
  const list = Array.isArray(data) ? data : Array.isArray(data?.questions) ? data.questions : null;
  if (!list) return { error: 'JSON must be an array of questions or an object with a "questions" array.' };
  if (list.length > 5000) return { error: 'Too many questions in one import (max 5000).' };

  const structural = [];
  list.forEach((item, i) => {
    const r = importedQuestionSchema.safeParse(item);
    if (!r.success) {
      structural.push({
        index: i + 1,
        message: `Item ${i + 1}: ${r.error.issues.map((x) => `${x.path.join('.') || 'value'} – ${x.message}`).join('; ')}`,
      });
    }
  });
  if (structural.length) return { error: 'Invalid question structure in JSON.', details: structural };
  return { questions: list, quiz: Array.isArray(data) ? null : data.quiz || null };
}
