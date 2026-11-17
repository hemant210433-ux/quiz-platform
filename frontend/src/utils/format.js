export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function humanDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
  return m ? `${m}m ${sec}s` : `${sec}s`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** ISO -> value for <input type="datetime-local"> in local time. */
export function isoToLocalInput(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}

export function localInputToIso(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const num = (n) => (typeof n === 'number' ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : n);

export function pluralize(n, word, plural = `${word}s`) {
  return `${num(n)} ${n === 1 ? word : plural}`;
}

export function quizPublicUrl(slug, baseUrl) {
  const base = (baseUrl || window.location.origin).replace(/\/$/, '');
  return `${base}/quiz/${slug}`;
}

export const storage = {
  get(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable (private mode) – app still works without resume */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const SAMPLE_MCQS = `Q1. What is the full form of CPU?

A. Central Processing Unit
B. Computer Processing Unit
C. Central Program Unit
D. Control Processing Unit

Answer: A

Explanation: CPU stands for Central Processing Unit.

Q2. Which of the following is an operating system?

A. MS Word
B. Windows
C. Google Chrome
D. Photoshop

Answer: B

Explanation: Windows is an operating system.

Q3. भारत की राजधानी क्या है?

A. मुंबई
B. नई दिल्ली
C. कोलकाता
D. चेन्नई

Answer: B

Explanation: नई दिल्ली भारत की राजधानी है।`;
