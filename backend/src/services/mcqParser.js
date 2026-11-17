/**
 * Deterministic bulk MCQ parser (no AI / no external services).
 *
 * Supported input (English, Hindi or any Unicode text):
 *
 *   Q1. Question text (may continue on following lines)
 *   A. Option text (may continue on following lines)
 *   B. ...
 *   C. ...
 *   D. ...
 *   Answer: A
 *   Explanation: Optional, may span several lines.
 *
 * Accepted variants
 *   Question start : "Q1.", "Q.1", "Q 1)", "Ques 1:", "Question 1 -", "प्रश्न 1.", "प्र. 1"
 *                    If NO line uses a Q-prefix, bare numbering "1." / "1)" is accepted instead.
 *   Options        : "A.", "A)", "(A)", "a)", "A:", "Option A:", Hindi "(क)", "ख." ...
 *                    Several options on one line separated by 2+ spaces or a tab.
 *   Answer         : "Answer: A", "Ans - (b)", "Correct Answer: B. Windows", "उत्तर: ग",
 *                    "Answer B", or the exact option text ("Answer: Windows").
 *   Explanation    : "Explanation:", "Expl.", "Solution:", "Sol:", "Reason:", "व्याख्या:", "स्पष्टीकरण:", "हल:"
 *
 * Blank lines, extra spaces, CRLF/LF/CR line endings and a leading BOM are handled.
 * Text is preserved as written (only leading/trailing whitespace of each line is trimmed).
 */

export const OPTION_KEYS = ['A', 'B', 'C', 'D'];

const HINDI_OPTION_MAP = { 'क': 'A', 'ख': 'B', 'ग': 'C', 'घ': 'D' };

const Q_PREFIX_RE =
  /^(?:Q(?:ues(?:tion)?)?|प्रश्न|प्र)\s*\.?\s*(?:No\.?\s*)?(\d{1,5})\s*(?:[.)\]:：\-–—]+\s*|\s+|$)(.*)$/iu;
const BARE_NUM_RE = /^(\d{1,5})\s*[.)\]:：]\s*(.*)$/u;
const OPTION_RE = /^(?:Option\s*)?[([]?\s*([A-Ea-e]|क|ख|ग|घ)\s*[.)\]:：]\s*(.*)$/u;
const ANSWER_LABEL = '(?:Correct\\s+Answer|Right\\s+Answer|Correct\\s+Option|Answer|Ans|सही\\s+उत्तर|उत्तर)';
const ANSWER_SEP_RE = new RegExp(`^${ANSWER_LABEL}\\s*[.:：\\-–—=]+\\s*(.*)$`, 'iu');
const ANSWER_BARE_RE = new RegExp(`^${ANSWER_LABEL}\\s+(\\(?\\s*(?:[A-Ea-e]|क|ख|ग|घ)\\s*\\)?)\\s*$`, 'iu');
const EXPLANATION_RE =
  /^(?:Explanation|Explain|Expl|Solution|Sol|Reason|व्याख्या|स्पष्टीकरण|हल)\s*[.:：\-–—]+\s*(.*)$/iu;
// Splits "A. foo   B. bar\tC. baz" into separate option chunks.
const INLINE_OPTION_SPLIT_RE = /(?:\s{2,}|\t+)(?=[([]?\s*(?:[B-Eb-e]|ख|ग|घ)\s*[.)\]:：]\s*)/u;

function normalizeNewlines(text) {
  return String(text ?? '')
    .replace(/^﻿/, '')
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ');
}

function optionKey(raw) {
  if (HINDI_OPTION_MAP[raw]) return HINDI_OPTION_MAP[raw];
  return raw.toUpperCase();
}

/**
 * Turn the text after "Answer:" into a letter. Returns { letter, raw }.
 * letter is 'A'-'D' when recognised, otherwise null (raw keeps what was written).
 */
export function parseAnswerValue(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return { letter: null, raw: '' };
  const m = raw.match(/^(?:Option\s*)?[([]?\s*([A-Za-z]|क|ख|ग|घ)\s*[)\]]?(?=$|[\s.):,;\-–—])/iu);
  if (m) {
    const key = optionKey(m[1]);
    return { letter: OPTION_KEYS.includes(key) ? key : null, raw: key.length === 1 ? key : raw };
  }
  return { letter: null, raw };
}

function appendText(existing, line) {
  if (existing === undefined || existing === null || existing === '') return line;
  return `${existing}\n${line}`;
}

function newBlock(questionNo, text, lineNo) {
  return {
    question_no: questionNo,
    question: text,
    options: {},
    correct_answer: '',
    explanation: '',
    source_line: lineNo,
    parse_errors: [],
    warnings: [],
    _answerSeen: false,
    _answerRaw: '',
  };
}

function finalizeBlock(b) {
  b.question = (b.question || '').trim();
  for (const k of Object.keys(b.options)) b.options[k] = b.options[k].trim();
  b.explanation = (b.explanation || '').trim();

  if (b._answerSeen) {
    const { letter, raw } = parseAnswerValue(b._answerRaw);
    if (letter) {
      b.correct_answer = letter;
    } else if (raw) {
      // Maybe the answer was written as the option text, e.g. "Answer: Windows".
      const hit = Object.entries(b.options).find(
        ([, t]) => t && t.toLowerCase() === raw.toLowerCase(),
      );
      if (hit) {
        b.correct_answer = hit[0];
        b.warnings.push(`Answer given as option text; interpreted as ${hit[0]}.`);
      } else {
        b.correct_answer = raw;
      }
    }
  }
  delete b._answerSeen;
  delete b._answerRaw;
  delete b._state;
  delete b._lastOption;
  return b;
}

/**
 * @param {string} text raw pasted text
 * @returns {{ questions: object[], globalErrors: object[], stats: object, mode: string }}
 */
export function parseMcqText(text) {
  const lines = normalizeNewlines(text).split('\n');
  const usesQPrefix = lines.some((l) => Q_PREFIX_RE.test(l.trim()));
  const mode = usesQPrefix ? 'q-prefix' : 'numbered';
  const startRe = usesQPrefix ? Q_PREFIX_RE : BARE_NUM_RE;

  const questions = [];
  const globalErrors = [];
  let cur = null;
  let preamble = [];

  const handleOption = (key, value, lineNo) => {
    if (key === 'E') {
      cur.parse_errors.push(`Line ${lineNo}: unsupported option "E" (only A–D are allowed).`);
      cur._state = 'ignored-option';
      return;
    }
    if (Object.prototype.hasOwnProperty.call(cur.options, key)) {
      cur.parse_errors.push(`Line ${lineNo}: option ${key} appears more than once.`);
      cur._state = 'ignored-option';
      return;
    }
    const expected = OPTION_KEYS[Object.keys(cur.options).length];
    if (expected && key !== expected) {
      cur.warnings.push(`Line ${lineNo}: option ${key} found where ${expected} was expected.`);
    }
    cur.options[key] = value;
    cur._lastOption = key;
    cur._state = 'option';
  };

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const line = lines[i].trim();
    if (!line) continue;

    // 1) New question?  (Never inside nothing; always wins.)
    const qm = line.match(startRe);
    if (qm) {
      if (cur) questions.push(finalizeBlock(cur));
      cur = newBlock(parseInt(qm[1], 10), (qm[2] || '').trim(), lineNo);
      cur._state = 'question';
      continue;
    }

    if (!cur) {
      preamble.push({ line: lineNo, text: line });
      continue;
    }

    // 2) Answer line
    const am = line.match(ANSWER_SEP_RE) || line.match(ANSWER_BARE_RE);
    if (am && !(cur._state === 'explanation' && cur._answerSeen)) {
      if (cur._answerSeen) {
        cur.parse_errors.push(`Line ${lineNo}: more than one answer line.`);
      } else {
        cur._answerSeen = true;
        cur._answerRaw = (am[1] || '').trim();
      }
      cur._state = cur._answerRaw ? 'answer-done' : 'answer-pending';
      continue;
    }

    // 3) Explanation line
    const em = line.match(EXPLANATION_RE);
    if (em) {
      if (cur.explanation) {
        cur.explanation = appendText(cur.explanation, em[1] || '');
      } else {
        cur.explanation = (em[1] || '').trim();
      }
      cur._state = 'explanation';
      continue;
    }

    // 4) Option line (only before the answer / explanation)
    if (cur._state === 'question' || cur._state === 'option' || cur._state === 'ignored-option') {
      const om = line.match(OPTION_RE);
      if (om) {
        const chunks = line.split(INLINE_OPTION_SPLIT_RE);
        for (const chunk of chunks) {
          const cm = chunk.trim().match(OPTION_RE);
          if (cm) handleOption(optionKey(cm[1]), (cm[2] || '').trim(), lineNo);
          else if (cur._state === 'option') cur.options[cur._lastOption] = appendText(cur.options[cur._lastOption], chunk.trim());
        }
        continue;
      }
    }

    // 5) Continuation text
    switch (cur._state) {
      case 'question':
        cur.question = appendText(cur.question, line);
        break;
      case 'option':
        cur.options[cur._lastOption] = appendText(cur.options[cur._lastOption], line);
        break;
      case 'ignored-option':
        break;
      case 'answer-pending':
        cur._answerRaw = line;
        cur._state = 'answer-done';
        break;
      case 'answer-done':
        // Unlabelled text after the answer is treated as an explanation.
        cur.explanation = appendText(cur.explanation, line);
        cur._state = 'explanation';
        cur.warnings.push(`Line ${lineNo}: text after the answer without an "Explanation:" label was treated as explanation.`);
        break;
      case 'explanation':
        cur.explanation = appendText(cur.explanation, line);
        break;
      default:
        break;
    }
  }
  if (cur) questions.push(finalizeBlock(cur));

  if (preamble.length) {
    globalErrors.push({
      code: 'TEXT_BEFORE_FIRST_QUESTION',
      line: preamble[0].line,
      message: `Ignored ${preamble.length} line(s) before the first question (starting at line ${preamble[0].line}): "${preamble[0].text.slice(0, 80)}"`,
    });
  }
  if (!questions.length && normalizeNewlines(text).trim()) {
    globalErrors.push({
      code: 'NO_QUESTIONS_FOUND',
      line: 1,
      message: 'No questions were detected. Each question must start with a number such as "Q1." or "1."',
    });
  }

  return {
    mode,
    questions,
    globalErrors,
    stats: { totalLines: lines.length, questionsFound: questions.length },
  };
}
