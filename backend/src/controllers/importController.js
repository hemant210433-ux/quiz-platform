import { z } from 'zod';
import { parseMcqText } from '../services/mcqParser.js';
import { validateQuestions, extractQuestionsFromJson } from '../services/questionValidator.js';
import { parseOrThrow, badRequest } from '../utils/helpers.js';

const MAX_TEXT_CHARS = 5_000_000; // ~5 MB of pasted text is far beyond 1000 MCQs

const parseSchema = z.object({
  text: z.string().max(MAX_TEXT_CHARS, 'Pasted text is too large.'),
});

/** POST /api/admin/import/parse – text -> structured JSON + validation report. */
export async function parse(req, res) {
  const { text } = parseOrThrow(parseSchema, req.body);
  if (!text.trim()) throw badRequest('Paste some questions first.');
  const started = process.hrtime.bigint();
  const parsed = parseMcqText(text);
  const validated = validateQuestions(parsed.questions);
  const ms = Number(process.hrtime.bigint() - started) / 1e6;
  res.json({
    mode: parsed.mode,
    globalErrors: parsed.globalErrors,
    questions: validated.questions,
    stats: { ...validated.stats, parseMs: Math.round(ms * 10) / 10 },
  });
}

const validateSchema = z.union([
  z.object({ questions: z.array(z.any()).max(5000) }),
  z.object({ json: z.string().max(20_000_000) }),
]);

/**
 * POST /api/admin/import/validate
 *   { questions: [...] }  – re-validate an edited list
 *   { json: "..." }       – validate an uploaded/pasted JSON file
 */
export async function validate(req, res) {
  const body = parseOrThrow(validateSchema, req.body);
  let list = body.questions;
  let quiz = null;
  if (body.json !== undefined) {
    const r = extractQuestionsFromJson(body.json);
    if (r.error) throw badRequest(r.error, r.details);
    list = r.questions;
    quiz = r.quiz;
  }
  const validated = validateQuestions(list);
  res.json({ questions: validated.questions, stats: validated.stats, quiz });
}
