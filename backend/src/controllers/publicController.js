import { getQuizBySlug, availability, publicQuizView } from '../services/quizService.js';
import * as results from '../services/resultService.js';
import { parseOrThrow, notFound } from '../utils/helpers.js';

const attemptToken = (req) => req.get('X-Attempt-Token') || '';

export async function getQuiz(req, res) {
  const quiz = await getQuizBySlug(req.params.slug);
  const av = availability(quiz);
  if (av.reason === 'NOT_FOUND') throw notFound(av.message);
  res.json({
    quiz: publicQuizView(quiz),
    availability: av.open ? { open: true } : { open: false, reason: av.reason, message: av.message },
  });
}

export async function start(req, res) {
  const body = parseOrThrow(results.startSchema, req.body, 'Please check your details.');
  const out = await results.startAttempt(req.params.slug, body);
  res.status(201).json(out);
}

export async function getAttempt(req, res) {
  res.json(await results.getAttemptForStudent(req.params.attemptId, attemptToken(req)));
}

export async function saveAnswers(req, res) {
  const body = parseOrThrow(results.answersSchema, req.body);
  res.json(await results.saveAnswers(req.params.attemptId, attemptToken(req), body));
}

export async function submit(req, res) {
  const body = parseOrThrow(results.answersSchema, req.body || {});
  const out = await results.submitAttempt(req.params.attemptId, attemptToken(req), body);
  res.json(out);
}

export async function reissueResult(req, res) {
  res.json(await results.reissueResultToken(req.params.attemptId, attemptToken(req)));
}

export async function getResult(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.json(await results.getResultByToken(req.params.resultToken));
}
