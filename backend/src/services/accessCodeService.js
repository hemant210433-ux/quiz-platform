import crypto from 'node:crypto';
import { readJson, updateJson } from '../storage/jsonStorage.js';
import { badRequest, notFound } from '../utils/helpers.js';
import { nowIso } from '../utils/clock.js';
import { getQuiz, assertQuizId } from './quizService.js';
import { z } from 'zod';

/*
 * Personal access codes ("passwords") for one quiz. The admin generates one code per student and
 * shares it privately; a code identifies the student, so changing the typed name does not give
 * a second attempt. Codes live inside the quiz record (so backups already include them).
 */

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I
export const CODE_LEN = 8;
const MAX_CODES = 2000;

/** "ab-cd 12ef" -> "ABCD12EF" (what is stored and compared). */
export const normalizeCode = (v) => String(v ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
/** "ABCD12EF" -> "ABCD-12EF" (what people see and type). */
export const formatCode = (c) => (c.length === CODE_LEN ? `${c.slice(0, 4)}-${c.slice(4)}` : c);

function newCode() {
  let s = '';
  for (let i = 0; i < CODE_LEN; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return s;
}

const generateSchema = z.object({
  count: z.coerce.number().int().min(1).max(500).optional(),
  // One code per name (e.g. a pasted class list). The name becomes the student's fixed name.
  names: z.array(z.string().trim().max(100)).max(500).optional(),
});

export async function listCodes(quizId) {
  const quiz = await getQuiz(quizId);
  const index = await readJson(`attempts/${quizId}/index.json`, { attempts: [] });
  const used = new Map();
  for (const a of index.attempts) {
    if (!a.accessCode) continue;
    const u = used.get(a.accessCode) || { attempts: 0, submitted: 0 };
    u.attempts++;
    if (a.status === 'submitted') u.submitted++;
    used.set(a.accessCode, u);
  }
  return (quiz.accessCodes || []).map((c) => ({
    code: c.code,
    display: formatCode(c.code),
    label: c.label,
    createdAt: c.createdAt,
    attempts: used.get(c.code)?.attempts || 0,
    submitted: used.get(c.code)?.submitted || 0,
  }));
}

export async function generateCodes(quizId, input) {
  assertQuizId(quizId);
  const parsed = generateSchema.safeParse(input || {});
  if (!parsed.success) throw badRequest('Enter how many codes you need (1–500).');
  const names = (parsed.data.names || []).map((n) => n.trim()).filter(Boolean);
  const count = names.length || parsed.data.count || 1;
  await updateJson(
    'quizzes.json',
    [],
    (quizzes) => {
      const quiz = quizzes.find((q) => q.id === quizId);
      if (!quiz) throw notFound('Quiz not found.');
      quiz.accessCodes ||= [];
      if (quiz.accessCodes.length + count > MAX_CODES) throw badRequest(`A quiz can have at most ${MAX_CODES} codes.`);
      const have = new Set(quiz.accessCodes.map((c) => c.code));
      const ts = nowIso();
      for (let i = 0; i < count; i++) {
        let code = newCode();
        while (have.has(code)) code = newCode();
        have.add(code);
        quiz.accessCodes.push({ code, label: names[i] || '', createdAt: ts });
      }
      quiz.updatedAt = ts;
    },
    {},
  );
  return listCodes(quizId);
}

export async function deleteCode(quizId, code) {
  assertQuizId(quizId);
  const c = normalizeCode(code);
  await updateJson('quizzes.json', [], (quizzes) => {
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) throw notFound('Quiz not found.');
    const before = (quiz.accessCodes || []).length;
    quiz.accessCodes = (quiz.accessCodes || []).filter((x) => x.code !== c);
    if (quiz.accessCodes.length === before) throw notFound('Code not found.');
  });
  return listCodes(quizId);
}
