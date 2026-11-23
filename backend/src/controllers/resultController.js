import * as results from '../services/resultService.js';

export async function list(req, res) {
  res.json(await results.getQuizResultsForAdmin(req.params.quizId));
}

export async function detail(req, res) {
  res.json(await results.getAttemptResultForAdmin(req.params.quizId, req.params.attemptId));
}

export async function removeAttempt(req, res) {
  res.json(await results.deleteAttempt(req.params.quizId, req.params.attemptId));
}

function sendCsv(res, { filename, csv }) {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

export async function exportCsv(req, res) {
  sendCsv(res, await results.exportQuizResultsCsv(req.params.quizId));
}

export async function exportAll(req, res) {
  sendCsv(res, await results.exportAllResultsCsv());
}
