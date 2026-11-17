import { round2 } from '../utils/helpers.js';

/**
 * Pure scoring function – the ONLY place marks are calculated. Runs on the server.
 *
 * @param {object} quiz       quiz metadata (marksPerQuestion, negativeMarking, negativeMarks)
 * @param {string[]} questionIds  ids of the questions in the attempt (in order)
 * @param {Map<string, object>} questionMap  id -> stored question (with correct_answer)
 * @param {Record<string,string>} answers  id -> selected letter
 */
export function scoreAttempt(quiz, questionIds, questionMap, answers) {
  const marks = Number(quiz.marksPerQuestion) || 0;
  const neg = quiz.negativeMarking ? Number(quiz.negativeMarks) || 0 : 0;

  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  const review = {};

  for (const qid of questionIds) {
    const q = questionMap.get(qid);
    const selected = answers?.[qid] || null;
    const correctAnswer = q?.correct_answer || null;
    if (!selected) {
      unattempted++;
      review[qid] = [null, correctAnswer];
    } else if (selected === correctAnswer) {
      correct++;
      review[qid] = [selected, correctAnswer];
    } else {
      incorrect++;
      review[qid] = [selected, correctAnswer];
    }
  }

  const total = questionIds.length;
  const totalMarks = round2(total * marks);
  const positive = correct * marks;
  const negativeMarks = round2(incorrect * neg);
  const obtainedMarks = round2(positive - negativeMarks);
  const percentage = totalMarks > 0 ? round2((obtainedMarks / totalMarks) * 100) : 0;

  return {
    summary: {
      totalQuestions: total,
      attempted: correct + incorrect,
      correct,
      incorrect,
      unattempted,
      totalMarks,
      obtainedMarks,
      negativeMarks,
      percentage,
    },
    // review[qid] = [selectedLetter|null, correctLetter] – snapshot at submission time
    review,
  };
}
