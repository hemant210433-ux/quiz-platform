import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseMcqText } from '../src/services/mcqParser.js';
import { validateQuestions, extractQuestionsFromJson } from '../src/services/questionValidator.js';
import { generateMcqs } from './helpers.js';

const codes = (q) => q.errors.map((e) => e.code);
const run = (text) => {
  const p = parseMcqText(text);
  return { ...p, v: validateQuestions(p.questions) };
};

describe('MCQ parser – volume', () => {
  test('1 MCQ (exact spec example)', () => {
    const { v } = run(`Q1. What is the full form of CPU?

A. Central Processing Unit
B. Computer Processing Unit
C. Central Program Unit
D. Control Processing Unit

Answer: A

Explanation: CPU stands for Central Processing Unit.`);
    assert.equal(v.stats.total, 1);
    assert.equal(v.stats.valid, 1);
    const q = v.questions[0];
    assert.deepEqual(
      { question_no: q.question_no, question: q.question, options: q.options, correct_answer: q.correct_answer, explanation: q.explanation },
      {
        question_no: 1,
        question: 'What is the full form of CPU?',
        options: { A: 'Central Processing Unit', B: 'Computer Processing Unit', C: 'Central Program Unit', D: 'Control Processing Unit' },
        correct_answer: 'A',
        explanation: 'CPU stands for Central Processing Unit.',
      },
    );
  });

  for (const n of [100, 500, 1000]) {
    test(`${n} MCQs parse and validate`, () => {
      const t0 = performance.now();
      const { v } = run(generateMcqs(n));
      const ms = performance.now() - t0;
      assert.equal(v.stats.total, n);
      assert.equal(v.stats.valid, n);
      assert.equal(v.stats.invalid, 0);
      assert.equal(v.questions[n - 1].question_no, n);
      assert.equal(v.questions[n - 1].correct_answer, 'ABCD'[n % 4]);
      assert.ok(ms < 2000, `parsing ${n} MCQs took ${ms}ms`);
    });
  }

  test('1000 MCQs with Windows line endings', () => {
    const { v } = run(generateMcqs(1000, { crlf: true }));
    assert.equal(v.stats.valid, 1000);
    assert.ok(!v.questions.some((q) => q.question.includes('\r')));
  });
});

describe('MCQ parser – languages & formatting', () => {
  test('Hindi MCQs (Devanagari labels and options)', () => {
    const { v } = run(generateMcqs(20, { hindi: true }));
    assert.equal(v.stats.valid, 20);
    assert.equal(v.questions[0].options.B, 'विकल्प दो 1');
    assert.equal(v.questions[0].correct_answer, 'B');
    assert.equal(v.questions[0].explanation, 'यह प्रश्न 1 की व्याख्या है।');
  });

  test('Hindi text with English labels', () => {
    const { v } = run('Q1. भारत की राजधानी क्या है?\nA. मुंबई\nB. नई दिल्ली\nC. कोलकाता\nD. चेन्नई\nAnswer: B\nExplanation: नई दिल्ली।');
    assert.equal(v.stats.valid, 1);
    assert.equal(v.questions[0].question, 'भारत की राजधानी क्या है?');
  });

  test('English MCQs with mixed label styles', () => {
    const { v } = run(`Question 1: Which is a primary colour?
(a) Green
(b) Red
(c) Purple
(d) Orange
Ans - (b)

Q.2) Pick the mammal
A) Shark  B) Whale  C) Trout  D) Eel
Correct Answer: B. Whale
Solution: Whales are mammals.`);
    assert.equal(v.stats.valid, 2, JSON.stringify(v.questions.map((q) => q.errors)));
    assert.equal(v.questions[0].correct_answer, 'B');
    assert.deepEqual(v.questions[1].options, { A: 'Shark', B: 'Whale', C: 'Trout', D: 'Eel' });
    assert.equal(v.questions[1].explanation, 'Whales are mammals.');
  });

  test('Multiline questions, options and explanations', () => {
    const { v } = run(`Q1. Read the code:
   let x = 1;
   x++;
What is x?
A. 1
B. 2
   (after increment)
C. 3
D. undefined
Answer: B
Explanation: x++ increments x.
It becomes 2.

  Note the post-increment.`);
    const q = v.questions[0];
    assert.equal(v.stats.valid, 1);
    assert.equal(q.question, 'Read the code:\nlet x = 1;\nx++;\nWhat is x?');
    assert.equal(q.options.B, '2\n(after increment)');
    assert.equal(q.explanation, 'x++ increments x.\nIt becomes 2.\nNote the post-increment.');
  });

  test('Blank lines, extra spaces and old Mac line endings', () => {
    const { v } = run('\r\r   Q1.    Spaced   question   \r\r A.   one \rB.two\rC. three\rD. four\r\r Answer :   C   \r');
    assert.equal(v.stats.valid, 1);
    assert.equal(v.questions[0].question, 'Spaced   question'); // inner text preserved
    assert.equal(v.questions[0].correct_answer, 'C');
  });

  test('Unicode characters are preserved', () => {
    const { v } = run('Q1. Which symbol is π? 😀 — “quotes”\nA. π\nB. Σ\nC. Ω\nD. ∞\nAnswer: A');
    assert.equal(v.questions[0].question, 'Which symbol is π? 😀 — “quotes”');
    assert.equal(v.questions[0].options.C, 'Ω');
  });

  test('Answer written as option text', () => {
    const { v } = run('Q1. OS?\nA. Word\nB. Windows\nC. Chrome\nD. Photoshop\nAnswer: Windows');
    assert.equal(v.questions[0].correct_answer, 'B');
  });

  test('Bare numbering fallback ("1.")', () => {
    const p = parseMcqText('1. First?\nA. a\nB. b\nC. c\nD. d\nAnswer: A\n\n2. Second?\nA. a\nB. b\nC. c\nD. d\nAnswer: D');
    assert.equal(p.mode, 'numbered');
    assert.equal(p.questions.length, 2);
  });
});

describe('MCQ validation – error detection', () => {
  test('Missing answers', () => {
    const { v } = run('Q1. No answer\nA. a\nB. b\nC. c\nD. d\n\nQ2. Empty answer\nA. a\nB. b\nC. c\nD. d\nAnswer:');
    assert.equal(v.stats.invalid, 2);
    assert.equal(v.stats.missingAnswers, 2);
    assert.ok(codes(v.questions[0]).includes('MISSING_ANSWER'));
  });

  test('Missing options and empty options', () => {
    const { v } = run('Q1. Only two\nA. a\nB. b\nAnswer: A\n\nQ2. Empty C\nA. a\nB. b\nC.\nD. d\nAnswer: A');
    assert.deepEqual(codes(v.questions[0]).sort(), ['MISSING_OPTION_C', 'MISSING_OPTION_D']);
    assert.deepEqual(codes(v.questions[1]), ['EMPTY_OPTION_C']);
  });

  test('Duplicate question numbers', () => {
    const { v } = run('Q1. a?\nA. a\nB. b\nC. c\nD. d\nAnswer: A\nQ1. b?\nA. a\nB. b\nC. c\nD. d\nAnswer: B');
    assert.equal(v.stats.duplicateNumbers, 1);
    assert.deepEqual(v.stats.duplicateNumberList, [1]);
    assert.ok(v.questions.every((q) => codes(q).includes('DUPLICATE_NUMBER')));
  });

  test('Duplicate options', () => {
    const { v } = run('Q1. dup?\nA. Same\nB. same \nC. c\nD. d\nAnswer: A');
    assert.ok(codes(v.questions[0]).includes('DUPLICATE_OPTIONS'));
  });

  test('Invalid answer letters', () => {
    const { v } = run('Q1. x?\nA. a\nB. b\nC. c\nD. d\nAnswer: E\n\nQ2. y?\nA. a\nB. b\nC. c\nD. d\nAnswer: Banana');
    assert.ok(codes(v.questions[0]).includes('INVALID_ANSWER'));
    assert.ok(codes(v.questions[1]).includes('INVALID_ANSWER'));
  });

  test('Malformed input is reported, never silently dropped', () => {
    const p = parseMcqText('random heading\nQ1. x?\nA. a\nA. again\nB. b\nC. c\nD. d\nE. e\nAnswer: A\nAnswer: B\nQ2.\nAnswer: A');
    const v = validateQuestions(p.questions);
    assert.equal(p.globalErrors[0].code, 'TEXT_BEFORE_FIRST_QUESTION');
    assert.equal(v.stats.total, 2);
    assert.ok(codes(v.questions[0]).includes('MALFORMED_BLOCK'));
    assert.ok(codes(v.questions[1]).includes('MISSING_QUESTION'));
    assert.ok(codes(v.questions[1]).includes('MISSING_OPTION_A'));
  });

  test('Completely unrecognised text', () => {
    const p = parseMcqText('hello world\nthis is not a quiz');
    assert.equal(p.questions.length, 0);
    assert.ok(p.globalErrors.some((e) => e.code === 'NO_QUESTIONS_FOUND'));
  });

  test('Invalid imported JSON', () => {
    assert.match(extractQuestionsFromJson('{not json').error, /Invalid JSON/);
    assert.match(extractQuestionsFromJson('{"a":1}').error, /array/);
    assert.ok(extractQuestionsFromJson('[{"question": 5}]').error);
    const ok = extractQuestionsFromJson(JSON.stringify([{ question_no: 1, question: 'Q', options: { A: 'a', B: 'b', C: 'c', D: 'd' }, correct_answer: 'a' }]));
    const v = validateQuestions(ok.questions);
    assert.equal(v.stats.valid, 1);
    assert.equal(v.questions[0].correct_answer, 'A');
  });
});
