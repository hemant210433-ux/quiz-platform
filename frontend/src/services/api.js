/**
 * Thin fetch wrapper for the backend API.
 * - Sends cookies (admin session) with every request.
 * - Adds the CSRF header expected by the server.
 * - Throws ApiError with { status, code, message, details } on failure.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/* ---------- Waking a sleeping backend (Render free tier) ----------
 * A sleeping Render service needs up to ~1 minute to start. Instead of showing an error we
 * tell the page ("qp:waking" event -> banner), poll /api/health until the server answers,
 * and then retry the request once. */
const COLD_STATUSES = new Set([502, 503, 504]);
let wakePromise = null;

function emitWaking(on) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('qp:waking', { detail: on }));
}

export function wakeBackend({ maxMs = 90000 } = {}) {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return Promise.resolve(false); // really offline
  if (wakePromise) return wakePromise;
  wakePromise = (async () => {
    emitWaking(true);
    const start = Date.now();
    try {
      while (Date.now() - start < maxMs) {
        try {
          const r = await fetch(`${API_BASE}/api/health`, { cache: 'no-store' });
          if (r.ok) return true;
        } catch {
          /* still asleep */
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      return false;
    } finally {
      emitWaking(false);
      wakePromise = null;
    }
  })();
  return wakePromise;
}

async function send(method, path, { body, headers = {}, signal, keepalive = false }) {
  try {
    return await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      signal,
      keepalive,
      headers: {
        'X-Requested-With': 'quiz-platform',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return null; // network failure
  }
}

async function request(method, path, opts = {}) {
  const { raw = false, keepalive = false } = opts;
  let res = await send(method, path, opts);
  const cold = (r) => r === null || COLD_STATUSES.has(r.status);
  // Retry once after waking the server. A 504 on a write may mean it already ran, so only
  // reads are retried on 504; writes are retried only when the request clearly never arrived.
  if (!keepalive && cold(res) && (method === 'GET' || res === null || res.status !== 504)) {
    if (await wakeBackend()) res = await send(method, path, opts);
  }
  if (res === null) {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your internet connection and try again in a minute.');
  }
  if (raw && res.ok) return res;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const e = data?.error || {};
    const msg = COLD_STATUSES.has(res.status) && !e.message ? 'The server is starting up. Please wait a minute and try again.' : e.message || `Request failed (${res.status})`;
    throw new ApiError(res.status, e.code || 'HTTP_ERROR', msg, e.details);
  }
  return data;
}

export const api = {
  get: (p, o) => request('GET', p, o),
  post: (p, body, o) => request('POST', p, { ...o, body: body ?? {} }),
  put: (p, body, o) => request('PUT', p, { ...o, body }),
  del: (p, o) => request('DELETE', p, o),
};

/* ---------- Auth ---------- */
export const authApi = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  changePassword: (body) => api.post('/api/auth/change-password', body),
};

/* ---------- Admin ---------- */
export const adminApi = {
  listQuizzes: () => api.get('/api/admin/quizzes'),
  getQuiz: (id) => api.get(`/api/admin/quizzes/${id}`),
  createQuiz: (data) => api.post('/api/admin/quizzes', data),
  updateQuiz: (id, data) => api.put(`/api/admin/quizzes/${id}`, data),
  deleteQuiz: (id) => api.del(`/api/admin/quizzes/${id}`),
  publish: (id) => api.post(`/api/admin/quizzes/${id}/publish`),
  unpublish: (id) => api.post(`/api/admin/quizzes/${id}/unpublish`),
  setStatus: (id, status) => api.post(`/api/admin/quizzes/${id}/status`, { status }),
  duplicate: (id) => api.post(`/api/admin/quizzes/${id}/duplicate`),

  parseText: (text) => api.post('/api/admin/import/parse', { text }),
  validateQuestions: (questions, signal) => api.post('/api/admin/import/validate', { questions }, { signal }),
  validateJson: (json) => api.post('/api/admin/import/validate', { json }),
  saveQuestions: (id, questions, mode = 'replace') => api.post(`/api/admin/quizzes/${id}/questions`, { questions, mode }),
  updateQuestion: (id, qid, patch) => api.put(`/api/admin/quizzes/${id}/questions/${qid}`, patch),
  deleteQuestion: (id, qid) => api.del(`/api/admin/quizzes/${id}/questions/${qid}`),

  results: (id) => api.get(`/api/admin/quizzes/${id}/results`),
  attemptResult: (id, attemptId) => api.get(`/api/admin/quizzes/${id}/results/${attemptId}`),

  getSettings: () => api.get('/api/admin/settings'),
  updateSettings: (data) => api.put('/api/admin/settings', data),
  listBackups: () => api.get('/api/admin/backups'),
  createBackup: () => api.post('/api/admin/backups'),
  restore: (body) => api.post('/api/admin/restore', body),
};

/** URLs for file downloads (GET, cookie-authenticated). */
export const downloadUrls = {
  questionsJson: (id) => `${API_BASE}/api/admin/quizzes/${id}/export`,
  quizJson: (id) => `${API_BASE}/api/admin/quizzes/${id}/export?full=1`,
  resultsCsv: (id) => `${API_BASE}/api/admin/quizzes/${id}/results/export`,
  allResultsCsv: () => `${API_BASE}/api/admin/results/export`,
  backup: () => `${API_BASE}/api/admin/backup`,
};

/* ---------- Public (students) ---------- */
const tok = (t) => ({ headers: { 'X-Attempt-Token': t } });
export const publicApi = {
  site: () => api.get('/api/public/site'),
  getQuiz: (slug) => api.get(`/api/public/quizzes/${encodeURIComponent(slug)}`),
  start: (slug, studentName, studentId) => api.post(`/api/public/quizzes/${encodeURIComponent(slug)}/start`, { studentName, studentId }),
  getAttempt: (attemptId, token) => api.get(`/api/public/attempts/${attemptId}`, tok(token)),
  saveAnswers: (attemptId, token, answers, marked, opts = {}) => api.put(`/api/public/attempts/${attemptId}/answers`, { answers, marked }, { ...tok(token), ...opts }),
  submit: (attemptId, token, answers, marked, auto = false) => api.post(`/api/public/attempts/${attemptId}/submit`, { answers, marked, auto }, tok(token)),
  reissueResult: (attemptId, token) => api.post(`/api/public/attempts/${attemptId}/result-token`, {}, tok(token)),
  getResult: (token) => api.get(`/api/public/results/${encodeURIComponent(token)}`),
};
