import { z } from 'zod';
import * as quizService from '../services/quizService.js';
import { resultCounts } from '../services/resultService.js';
import { parseOrThrow, badRequest } from '../utils/helpers.js';
import { ZodError } from 'zod';

function zodToBad(err) {
  if (err instanceof ZodError) {
    return badRequest('Please correct the highlighted fields.', err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
  }
  return err;
}

export async function list(req, res) {
  const [quizzes, counts] = await Promise.all([quizService.listQuizzes(), resultCounts()]);
  res.json({
    quizzes: quizzes
      .map((q) => ({ ...q, attempts: counts[q.id]?.attempts || 0, submissions: counts[q.id]?.submitted || 0 }))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  });
}

export async function create(req, res) {
  try {
    const quiz = await quizService.createQuiz(req.body);
    res.status(201).json({ quiz });
  } catch (err) {
    throw zodToBad(err);
  }
}

export async function get(req, res) {
  const quiz = await quizService.getQuiz(req.params.quizId);
  const { questions, stats } = await quizService.getValidatedQuestions(quiz.id);
  res.json({ quiz, questions, stats });
}

export async function update(req, res) {
  try {
    const quiz = await quizService.updateQuiz(req.params.quizId, req.body);
    res.json({ quiz });
  } catch (err) {
    throw zodToBad(err);
  }
}

export async function remove(req, res) {
  await quizService.deleteQuiz(req.params.quizId);
  res.json({ ok: true });
}

export async function publish(req, res) {
  const quiz = await quizService.setQuizStatus(req.params.quizId, 'published');
  res.json({ quiz });
}

export async function unpublish(req, res) {
  const quiz = await quizService.setQuizStatus(req.params.quizId, 'draft');
  res.json({ quiz });
}

const statusSchema = z.object({ status: z.enum(quizService.QUIZ_STATUSES) });
export async function setStatus(req, res) {
  const { status } = parseOrThrow(statusSchema, req.body);
  const quiz = await quizService.setQuizStatus(req.params.quizId, status);
  res.json({ quiz });
}

export async function duplicate(req, res) {
  const quiz = await quizService.duplicateQuiz(req.params.quizId);
  res.status(201).json({ quiz });
}

/* ---------- Questions ---------- */

const saveSchema = z.object({
  questions: z.array(z.any()).max(5000, 'At most 5000 questions per quiz.'),
  mode: z.enum(['replace', 'append']).optional().default('replace'),
});

export async function saveQuestions(req, res) {
  const { questions, mode } = parseOrThrow(saveSchema, req.body);
  const result = await quizService.saveQuestions(req.params.quizId, questions, mode);
  const quiz = await quizService.getQuiz(req.params.quizId);
  res.json({ quiz, questions: result.questions, stats: result.stats });
}

const questionPatchSchema = z
  .object({
    question_no: z.coerce.number().int().positive().optional(),
    type: z.enum(['mcq', 'tf']).optional(),
    question: z.string().max(10000).optional(),
    options: z.object({ A: z.string().max(10000), B: z.string().max(10000), C: z.string().max(10000), D: z.string().max(10000) }).partial().optional(),
    correct_answer: z.string().max(5).optional(),
    explanation: z.string().max(10000).optional(),
    topic: z.string().trim().max(120).optional(),
  })
  .strict();

export async function updateQuestion(req, res) {
  const patch = parseOrThrow(questionPatchSchema, req.body);
  const out = await quizService.updateQuestion(req.params.quizId, req.params.questionId, patch);
  res.json(out);
}

export async function deleteQuestion(req, res) {
  const out = await quizService.deleteQuestion(req.params.quizId, req.params.questionId);
  res.json(out);
}

/** Download questions as JSON (canonical schema). */
export async function exportQuestions(req, res) {
  const quiz = await quizService.getQuiz(req.params.quizId);
  const { questions } = await quizService.getStoredQuestions(quiz.id);
  const full = req.query.full === '1';
  const payload = full
    ? {
        format: 'quiz-platform-quiz',
        version: 1,
        exportedAt: new Date().toISOString(),
        quiz: {
          title: quiz.title,
          description: quiz.description,
          instructions: quiz.instructions,
          durationMinutes: quiz.durationMinutes,
          marksPerQuestion: quiz.marksPerQuestion,
          negativeMarking: quiz.negativeMarking,
          negativeMarks: quiz.negativeMarks,
          maxAttempts: quiz.maxAttempts,
          startAt: quiz.startAt,
          endAt: quiz.endAt,
          accessMode: quiz.accessMode || 'name',
        },
        questions: questions.map(({ id, parse_errors, ...q }) => q), // eslint-disable-line no-unused-vars
      }
    : questions.map(({ id, parse_errors, ...q }) => q); // eslint-disable-line no-unused-vars
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${quiz.slug}${full ? '-quiz' : '-questions'}.json"`);
  res.send(JSON.stringify(payload, null, 2));
}
