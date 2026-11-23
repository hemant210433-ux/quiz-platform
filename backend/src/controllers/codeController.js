import * as codes from '../services/accessCodeService.js';

export async function list(req, res) {
  res.json({ codes: await codes.listCodes(req.params.quizId) });
}

export async function generate(req, res) {
  res.status(201).json({ codes: await codes.generateCodes(req.params.quizId, req.body) });
}

export async function remove(req, res) {
  res.json({ codes: await codes.deleteCode(req.params.quizId, req.params.code) });
}
