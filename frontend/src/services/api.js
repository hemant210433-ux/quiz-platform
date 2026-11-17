/**
 * Thin fetch wrapper for the backend API.
 * - Sends cookies (admin session) with every request.
 * - Adds the CSRF header expected by the server.
 * - Throws ApiError with { status, code, message, details } on failure.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request(method, path, { body, headers = {}, signal, raw = false, keepalive = false } = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
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
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your internet connection.');
  }
  if (raw && res.ok) return res;
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const e = data?.error || {};
    throw new ApiError(res.status, e.code || 'HTTP_ERROR', e.message || `Request failed (${res.status})`, e.details);
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
