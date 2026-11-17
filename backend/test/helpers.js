import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/** Generate N well-formed MCQs in the standard paste format. */
export function generateMcqs(n, { hindi = false, crlf = false } = {}) {
  const blocks = [];
  for (let i = 1; i <= n; i++) {
    const ans = 'ABCD'[i % 4];
    blocks.push(
      hindi
        ? `प्रश्न ${i}. प्रश्न संख्या ${i} का सही उत्तर कौन सा है?\n\n(क) विकल्प एक ${i}\n(ख) विकल्प दो ${i}\n(ग) विकल्प तीन ${i}\n(घ) विकल्प चार ${i}\n\nउत्तर: ${'कखगघ'['ABCD'.indexOf(ans)]}\n\nव्याख्या: यह प्रश्न ${i} की व्याख्या है।`
        : `Q${i}. Sample question number ${i}?\n\nA. Option one ${i}\nB. Option two ${i}\nC. Option three ${i}\nD. Option four ${i}\n\nAnswer: ${ans}\n\nExplanation: Explanation for question ${i}.`,
    );
  }
  const text = blocks.join('\n\n');
  return crlf ? text.replace(/\n/g, '\r\n') : text;
}

/** Fresh, isolated data directory for a test file. Must be called BEFORE importing app modules. */
export function useTempDataDir(prefix = 'quiz-test-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  process.env.NODE_ENV = 'test';
  process.env.DATA_DIR = dir;
  process.env.LOGIN_RATE_MAX = process.env.LOGIN_RATE_MAX || '50';
  return dir;
}
