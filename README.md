# Quiz Platform — bulk MCQ import, public quiz links, instant results

A Google Forms–style quiz platform built for one job above all: **paste 500–1000 MCQs at once, check them, publish one quiz, and share a link.** Students open the link, enter their name, take a timed quiz, and see their result as soon as they submit. The admin sees every attempt, analytics, and CSV exports.

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3
- **Backend:** Node.js (≥ 20) + Express 4, Zod validation, bcrypt password hashing, Helmet, rate limiting
- **Storage:** **MongoDB Atlas** in production (set `MONGODB_URI`). Without it, the app falls back to JSON files on disk (handy for local development). Both use the same storage API, with atomic updates, backup and restore.
- **No AI and no external APIs.** The MCQ parser is a deterministic JavaScript state machine.

---

## Contents

1. [Project structure](#1-project-structure)
2. [Installation](#2-installation)
3. [Running (development)](#3-running-development)
4. [Admin setup](#4-admin-setup)
5. [MCQ input format](#5-mcq-input-format)
6. [JSON format](#6-json-format)
7. [Publishing a quiz](#7-publishing-a-quiz)
8. [Sharing the link with students](#8-sharing-the-link-with-students)
9. [Results management](#9-results-management)
10. [API reference](#10-api-reference)
11. [Security model](#11-security-model)
12. [Limitations (please read)](#12-limitations-please-read)
13. [Testing](#13-testing)
14. [Deployment guide](#14-deployment-guide)
15. [Backup and restore](#15-backup-and-restore)

---

## 1. Project structure

```
quiz-platform/
├── package.json                 # convenience scripts (install:all, build, start, test)
├── backend/
│   ├── .env.example
│   ├── package.json
│   ├── data/                    # runtime data (git-ignored) – put on a persistent disk in production
│   │   ├── admin.json           # { username, passwordHash (bcrypt) }
│   │   ├── quizzes.json         # quiz metadata
│   │   ├── settings.json        # site name, public base URL
│   │   ├── sessions.json        # SHA-256 hashes of admin session tokens
│   │   ├── questions/<quizId>.json
│   │   ├── attempts/<quizId>/index.json            # one small row per attempt
│   │   ├── attempts/<quizId>/<attemptId>.json      # answers of one attempt
│   │   ├── results/<quizId>.json                   # one summary row per submission
│   │   ├── results/<quizId>.stats.json             # question-wise aggregates
│   │   └── backups/backup-*.json
│   ├── src/
│   │   ├── server.js            # boot: storage init, admin bootstrap, listen
│   │   ├── app.js               # Express app (Helmet, CORS, routes, static frontend)
│   │   ├── config/index.js      # all environment configuration
│   │   ├── middleware/          # authMiddleware, errorMiddleware, rateLimiters
│   │   ├── routes/              # authRoutes, quizRoutes, importRoutes, resultRoutes, publicRoutes
│   │   ├── controllers/         # thin HTTP layer
│   │   ├── services/
│   │   │   ├── mcqParser.js         # text -> questions
│   │   │   ├── questionValidator.js # per-question rules + Zod schemas
│   │   │   ├── quizService.js       # quizzes, questions, publishing, availability
│   │   │   ├── scoringService.js    # the only place marks are calculated
│   │   │   ├── resultService.js     # attempts, submission, results, analytics, CSV
│   │   │   ├── authService.js       # bcrypt, sessions
│   │   │   └── backupService.js     # backup bundles, restore
│   │   ├── storage/
│   │   │   ├── jsonStorage.js   # atomic read/write/update, corruption recovery
│   │   │   └── fileLock.js      # per-file promise queue (mutex)
│   │   ├── scripts/             # setupAdmin.js, backup.js, restore.js
│   │   └── utils/
│   └── test/                    # parser, storage and API tests (node:test + supertest)
└── frontend/
    ├── index.html, vite.config.js, tailwind.config.js
    └── src/
        ├── App.jsx, main.jsx, index.css
        ├── services/api.js
        ├── hooks/               # useAuth, useToast, useConfirm, useQuiz
        ├── components/
        │   ├── layout/          # AdminLayout (sidebar), PublicLayout
        │   ├── common/          # Modal, Spinner, StatCard, Pagination, Alert, Tabs…
        │   ├── admin/           # QuestionEditor, QuestionCard, QuizHeader
        │   └── quiz/            # QuestionNavGrid, ResultView
        └── pages/
            ├── AdminLogin, Dashboard, ManageQuizzes, CreateQuiz (create + edit details)
            ├── QuizOverview (publish, share link), ImportQuestions, QuestionPreview
            ├── QuizResults, AttemptDetail, ResultsIndex, Settings
            └── QuizLanding, StudentQuiz, StudentResult      (public)
```

How this differs from the suggested layout: attempts are stored **one file per attempt** (`attempts/<quizId>/<attemptId>.json`) rather than one file per quiz. Answers are autosaved every few seconds, so with a single shared file every student's save would rewrite the same, ever-growing file. With one file per attempt, saves never compete with each other.

---

## 2. Installation

Requirements: **Node.js 20 or newer** (22 LTS recommended) and npm.

```bash
cd quiz-platform
npm run install:all          # = (cd backend && npm install) && (cd frontend && npm install)
```

---

## 3. Running (development)

Use two terminals.

```bash
# Terminal 1 – backend API on http://localhost:4000
cd backend
cp .env.example .env         # then edit it: for local dev set NODE_ENV=development, COOKIE_SECURE=false,
                             # SERVE_FRONTEND=false and DATA_DIR=./data
npm run setup-admin          # create the admin account (see §4)
npm run dev                  # node --watch src/server.js

# Terminal 2 – frontend on http://localhost:5173 (proxies /api to :4000)
cd frontend
npm run dev
```

Open **http://localhost:5173/admin** and sign in.

> Without a `.env` file the backend uses development defaults: port 4000, `backend/data`, non-secure cookies, and CORS allowed for `http://localhost:5173`.

### Production-style run on one port

```bash
npm run build                                  # builds frontend/dist
cd backend && NODE_ENV=production SERVE_FRONTEND=true COOKIE_SECURE=false npm start
# → http://localhost:4000/admin   (COOKIE_SECURE=false only because this is plain http on localhost)
```

---

## 4. Admin setup

There is exactly **one admin account**. The password is stored only as a bcrypt hash (cost 12), in `data/admin.json`. No default password is included anywhere.

**Option A: interactive (recommended)**

```bash
cd backend
npm run setup-admin
# Admin username: teacher
# Admin password (min 10 chars, letters + numbers): ********
```

**Option B: non-interactive (CI or containers)**

```bash
ADMIN_USERNAME=teacher ADMIN_PASSWORD='a-long-Passw0rd' npm run setup-admin
```

**Option C: first-boot environment variables.** If `admin.json` does not exist when the server starts and both `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set, the admin is created. These variables never overwrite an existing admin. Remove them after the first start.

Password rules: at least 10 characters, containing both letters and numbers. To reset a forgotten password, run `npm run setup-admin` again on the server. Changing credentials, either this way or from **Settings → Admin account**, signs out every session.

---

## 5. MCQ input format

Paste into **Bulk Import → Paste MCQ text** or upload a `.txt` file.

```
Q1. What is the full form of CPU?

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

प्रश्न 3. भारत की राजधानी क्या है?
(क) मुंबई
(ख) नई दिल्ली
(ग) कोलकाता
(घ) चेन्नई
उत्तर: ख
व्याख्या: नई दिल्ली भारत की राजधानी है।
```

| Part | Accepted forms |
|---|---|
| Question start | `Q1.` `Q.1` `Q 1)` `Ques 1:` `Question 1 -` `प्रश्न 1.` `प्र. 1`. If no line uses a Q-prefix, plain `1.` / `1)` is accepted instead. |
| Options | `A.` `A)` `(A)` `a)` `A:` `Option A:` and Hindi `(क)` `ख.` `(ग)` `घ)` → A–D. Several options can share one line when separated by 2+ spaces or a tab (`A) x   B) y   C) z   D) w`). |
| Answer | `Answer: A`, `Ans - (b)`, `Correct Answer: B. Windows`, `उत्तर: ग`, `Answer B`, or the exact option text (`Answer: Windows`). |
| Explanation (optional) | `Explanation:` `Expl.` `Solution:` `Sol:` `Reason:` `व्याख्या:` `स्पष्टीकरण:` `हल:` |

The parser also handles:

- Questions, options and explanations that span several lines (the line breaks are kept).
- Blank lines anywhere.
- Windows (CRLF), Linux (LF) and old Mac (CR) line endings, plus a leading BOM.
- Extra spaces. The inner text is kept exactly as written; only the ends of each line are trimmed.
- Any Unicode text: Hindi, emoji, math symbols.

**Validation.** Every question is checked separately. Invalid questions are never dropped silently; each one is listed with its error. The checks are:

- missing question text
- missing option A, B, C or D
- an empty option
- a missing answer
- an invalid answer letter
- an answer that points to an empty option
- duplicate question numbers
- duplicate option text
- an extra option E
- a malformed block (for example, the same option twice or two answer lines)
- text before the first question

A quiz **cannot be published while any question is invalid.**

On a typical machine, 1000 MCQs parse and validate in about 15 ms on the server. The preview is paginated (20 per page) and stays responsive at any size.

---

## 6. JSON format

Every question uses the same schema, whether it is stored, exported or imported:

```json
{
  "question_no": 1,
  "question": "What is the full form of CPU?",
  "options": {
    "A": "Central Processing Unit",
    "B": "Computer Processing Unit",
    "C": "Central Program Unit",
    "D": "Control Processing Unit"
  },
  "correct_answer": "A",
  "explanation": "CPU stands for Central Processing Unit."
}
```

- **Export questions JSON** (on the Questions tab) downloads an array of these objects.
- **Export full quiz** wraps the array as `{ "format": "quiz-platform-quiz", "quiz": { …settings… }, "questions": [ … ] }`.
- **Import JSON** accepts either form, from a pasted string or an uploaded `.json` file. It validates the structure with Zod first, then validates each question, and opens the editable preview.
- `options` may also be an array of four strings, and `correct_answer` is not case-sensitive.

---

## 7. Publishing a quiz

1. **Create Quiz.** Enter the title, description, instructions, duration, marks per question, and optionally negative marking, maximum attempts per student, and an availability window.
2. **Import.** Paste the MCQs (or a JSON file) and click **Parse & validate**.
3. **Review.** Search and filter (all, valid, invalid, duplicate numbers, missing answers). In the editor you can:
   - edit a question, its options, the correct answer or the explanation
   - delete a question
   - move a question up, down, or to a position
   - add a question
   - renumber all questions
   - delete all invalid questions

   Every change is validated again automatically, or you can click **Validate again**.
4. **Save questions to quiz** (or **Append** to the existing questions).
5. **Overview → Publish quiz.** The checklist shows anything that still blocks publishing.

Quiz statuses:

- **Draft:** only the admin can see it.
- **Published:** the link works.
- **Closed:** the link shows a "closed" message, and results are kept.
- **Archived:** hidden.

**Unpublish** returns the quiz to Draft. While a quiz is published its questions are locked, so students in the middle of an attempt always see the same paper. You can also **edit details** (including the link slug), **duplicate**, or **delete** a quiz; deleting asks you to type `DELETE` when the quiz has attempts.

---

## 8. Sharing the link with students

After you publish, the Overview shows the public link, for example `https://quiz.example.com/quiz/ccc-september-2026`, with **Copy link**, **Share…** (the phone or OS share sheet, where the browser supports it) and **Open** buttons. Set **Settings → Public base URL** if links should use a different domain from the one you use for admin.

What students experience:

1. The landing page shows the title, description, number of questions, duration, maximum marks, the marking scheme and the instructions.
2. They enter a name (required) and optionally a student ID or roll number, tick that they have read the instructions, and click **Start quiz**.
3. Questions appear one at a time. Students can:
   - pick one of four options (A–D or 1–4 on the keyboard)
   - move with Previous / Next (or ← →)
   - jump using the question palette, which shows answered, unanswered, marked, and current
   - mark a question for review, or clear an answer
4. The countdown timer is visible at all times. Answers autosave to the server. If the page reloads on the same device, the attempt resumes with all answers and the current position.
5. Students submit after a confirmation step, or the quiz submits itself when time runs out. They then see their score, percentage, correct, incorrect and unanswered counts, their own answer next to the correct one, and explanations. The result page has a private link and a **Print / save PDF** button.

---

## 9. Results management

Open **Results** in the sidebar (or the **Results** tab of a quiz).

- **Analytics:** total attempts (including attempts in progress), completed attempts, average, highest and lowest score, and average percentage.
- **Student results table:**
  - columns: attempt #, name, student ID, score, %, correct, wrong, skipped, time taken, submission time, and whether the attempt was auto-submitted
  - search by name or student ID
  - sort by any column
  - filter by a pass mark (pass or fail) or show only auto-submitted attempts
  - 25 rows per page
- **View** opens one student's full answer sheet, which you can print.
- **Question-wise performance:** for every question, how many students attempted it, how many got it right, the accuracy, and how many picked each option. Sort by accuracy to find the hardest questions.
- **Export CSV** exports one quiz. **Export all results** exports every quiz. Files are UTF-8 with a BOM so Excel shows Hindi names correctly, and cells are protected against formula injection.
- Students who closed the tab and never submitted are scored automatically with the answers saved before their deadline.

---

## 10. API reference

All responses are JSON. Errors look like `{ "error": { "code": "…", "message": "…", "details"?: […] } }` and use the matching HTTP status (400, 401, 403, 404, 409, 410, 413, 429, 500).

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | – | Health check |
| POST | `/api/auth/login` | – (rate limited) | Admin login → HTTP-only cookie |
| POST | `/api/auth/logout` | cookie | Logout |
| GET | `/api/auth/me` | cookie | Current admin |
| POST | `/api/auth/change-password` | admin | Change username/password |
| GET / POST | `/api/admin/quizzes` | admin | List / create |
| GET / PUT / DELETE | `/api/admin/quizzes/:quizId` | admin | Get (with validated questions) / update details / delete |
| POST | `/api/admin/quizzes/:quizId/publish` · `/unpublish` · `/status` · `/duplicate` | admin | Lifecycle |
| GET | `/api/admin/quizzes/:quizId/export[?full=1]` | admin | Questions / full quiz JSON |
| POST | `/api/admin/import/parse` | admin | `{ text }` → questions + validation |
| POST | `/api/admin/import/validate` | admin | `{ questions }` or `{ json }` → validation |
| POST | `/api/admin/quizzes/:quizId/questions` | admin | `{ questions, mode: replace\|append }` |
| PUT / DELETE | `/api/admin/quizzes/:quizId/questions/:questionId` | admin | Edit / delete one question |
| GET | `/api/admin/quizzes/:quizId/results` | admin | Analytics + rows + question performance |
| GET | `/api/admin/quizzes/:quizId/results/export` | admin | CSV |
| GET | `/api/admin/quizzes/:quizId/results/:attemptId` | admin | One student's full result |
| GET | `/api/admin/results/export` | admin | CSV of all quizzes |
| GET / PUT | `/api/admin/settings` | admin | Site settings |
| GET | `/api/admin/backup` | admin | Download backup bundle |
| GET / POST | `/api/admin/backups` | admin | List / create server-side backups |
| POST | `/api/admin/restore` | admin | `{ bundle }` or `{ name }` |
| GET | `/api/public/quizzes/:slug` | – | Public quiz info and availability (never answers) |
| POST | `/api/public/quizzes/:slug/start` | – | `{ studentName, studentId? }` → `{ attemptId, accessToken }` |
| GET | `/api/public/attempts/:attemptId` | `X-Attempt-Token` | Questions (no answers), saved answers, remaining time |
| PUT | `/api/public/attempts/:attemptId/answers` | `X-Attempt-Token` | Autosave `{ answers, marked }` |
| POST | `/api/public/attempts/:attemptId/submit` | `X-Attempt-Token` | Submit → `{ resultToken, summary }` |
| POST | `/api/public/attempts/:attemptId/result-token` | `X-Attempt-Token` | Re-issue a lost result token |
| GET | `/api/public/results/:resultToken` | token in URL | The student's own result |

Admin requests that change state must also send `X-Requested-With: quiz-platform` (CSRF protection). The frontend sends it automatically.

---

## 11. Security model

- **Admin authentication**
  - The password is hashed with bcrypt (the pure-JS `bcryptjs` package, so no native build tools are needed).
  - The session is a random 256-bit token in an `HttpOnly`, `SameSite=Lax` cookie, which is `Secure` in production. The server stores only its SHA-256 hash.
  - Sessions expire after `SESSION_TTL_HOURS`.
  - Failed logins are rate-limited (10 per 15 minutes per IP by default). A wrong username takes about as long to reject as a wrong password.
- **Admin routes**
  - Every `/api/admin/*` route requires a session.
  - State-changing requests also need the custom `X-Requested-With` header. Browsers cannot send it cross-site without passing the CORS policy, so this blocks CSRF.
- **No answers before submission.** The public quiz and attempt endpoints never include `correct_answer` or explanations. Tests check this.
- **Server-side scoring and timing**
  - The browser sends only the letters a student picked. Any `score` field it sends is ignored.
  - The deadline is set on the server when the attempt starts (it is the earlier of the duration and the quiz's end date). The browser timer is only a display.
  - After the deadline plus `SUBMIT_GRACE_SECONDS` (30 s by default, which covers slow networks), saving answers returns `410`, and late answers sent with a submit are ignored.
- **Duplicate submissions are impossible.** Submission runs under the attempt file's lock. A second submit gets `409` and the original result is kept.
- **Students only see their own result.**
  - Attempts need the unguessable attempt ID plus a separate access token, which is kept in the student's browser.
  - Results need a 192-bit result token that only that student receives. Only hashes of these tokens are stored.
  - There is no public endpoint that lists results or attempts.
- **Availability rules are checked on the server.** Draft and archived quizzes return 404, closed quizzes return 403, and the start and end window plus the attempt limit are enforced on every start.
- **Other hardening**
  - Helmet sets security headers, including a Content Security Policy.
  - CORS uses an explicit origin allow-list.
  - Request bodies have size limits.
  - Every request body is validated with Zod.
  - File paths are confined to the data directory.
  - Restore accepts only known file names.
  - The data directory is never served. Express serves only `frontend/dist`, and every unknown path returns `index.html`.

---

## 12. Limitations (please read)

**This is a public quiz platform, not a proctored exam or identity-verification system.**

- **Anyone with the link can take the quiz under any name.** Student names and IDs are typed in, not verified. The "maximum attempts per student" setting matches on name + student ID, so a student can get around it by typing a different name. Treat it as a speed bump, not a hard rule.
- **No proctoring.** Students can look things up, switch tabs, or work together. Questions are delivered to the browser during the attempt, so they can be copied or captured. Correct answers are never sent before submission.
- **Resume works on the same browser only.** The attempt credentials live in that browser's local storage. On a different device the student cannot resume. The server still has their saved answers and auto-submits them when time runs out.
- **Result links are bearer links.** Anyone who receives a student's result URL can view that result.

**Storage:**

- **MongoDB mode (production, `MONGODB_URI` set):** every former JSON file is one document in the `kv` collection. Updates are version-checked, so even several server instances cannot overwrite each other. A single document must stay under MongoDB's 16 MB limit (a quiz with ~20,000 questions or a backup of a huge database could reach it). Atlas free (M0) has no automatic backups, so download a backup from **Settings** regularly.
- **File mode (no `MONGODB_URI`, local development only):** designed for **one backend process with a persistent disk**. Ephemeral disks (Render free, Heroku, Vercel…) lose everything on restart, so never use file mode there.

---

## 13. Testing

```bash
cd backend
npm test
```

There are 54 automated tests, built on `node:test` and `supertest`. Each test file uses its own temporary data directory.

**Parser and validation**

- 1, 100, 500 and 1000 MCQs, including 1000 with CRLF line endings
- Hindi (Devanagari labels and text), English, mixed label styles, Unicode
- multiline questions, options and explanations; blank lines, extra spaces, CR line endings
- answer given as option text; bare-number fallback
- missing answers, missing or empty options, duplicate question numbers, duplicate options, invalid answer letters, malformed input, unrecognised text, invalid imported JSON

**Storage**

- 500 concurrent read-modify-write updates with no lost writes and no leftover temp files
- concurrent writes to many files
- `.bak` creation and recovery from a corrupt file
- path traversal refusal; schema-validated writes

**API and application**

- admin login, invalid login, HttpOnly cookie, protected routes, CSRF header, logout
- quiz creation and validation, update, slug conflicts, duplicate, delete
- publishing rules (empty or invalid quizzes, parse errors), 1000-MCQ import and publish, question edit and delete, edit lock while published
- JSON export and re-import
- public link access, draft not public, no answers in public payloads
- quiz start and name validation; answer saving; page refresh / resume
- wrong-token access blocked; client-sent score ignored
- score calculation with negative marking; duplicate submission blocked
- result visibility; result-token re-issue; unauthorized result access
- attempt limit
- timer expiry (late saves rejected, late answers ignored, abandoned attempts auto-submitted, time taken capped)
- admin dashboard analytics; individual result; per-quiz and all-quiz CSV export
- 25 students starting and submitting at once (unique attempt numbers, no lost results)
- closed quizzes; availability window
- backup download and restore, safety backup, rejection of invalid or malicious bundles

The full browser flow was also tested end to end with Playwright: login, create, paste 1001 MCQs, fix the invalid one, save, publish, a student on mobile takes the quiz, refreshes mid-quiz and resumes, submits and sees the result, an admin views results and a single attempt, and a 1-minute quiz auto-submits when the timer runs out.

---

## 14. Deployment guide

**Recommended (free) stack: MongoDB Atlas + Render (API) + Vercel (frontend).**
The full step-by-step guide (in Hinglish) is in **[DEPLOYMENT.md](DEPLOYMENT.md)**.

```
Browser ──► Vercel (React app)
               └─ /api/* rewrite ─► Render (Express API) ──► MongoDB Atlas
```

Vercel proxies `/api/*` to the Render service (see `frontend/vercel.json`), so the browser only ever talks to one origin: no CORS, and the admin cookie is first-party (works in Safari/Brave too).

Key environment variables (backend): `MONGODB_URI`, `MONGODB_DB`, `NODE_ENV=production`, `SERVE_FRONTEND=false`, `TRUST_PROXY=1`, `COOKIE_SECURE=true`, `COOKIE_SAMESITE=lax`, `ADMIN_USERNAME` / `ADMIN_PASSWORD` (first start only). See `backend/.env.example`.

Moving old local data into MongoDB: `MONGODB_URI="..." npm run migrate-to-mongo` (from the project root).

Single-server alternative (VPS): set `SERVE_FRONTEND=true`, run `npm run build && npm start`, and put Nginx/Caddy with HTTPS in front. Use either MongoDB or a persistent `DATA_DIR`.

---

## 15. Backup and restore

Every JSON write also keeps the previous version as `<file>.bak`. If a file is ever unreadable, it is moved aside as `<file>.corrupt-<time>` and the `.bak` copy is used automatically.

**From the admin UI** (Settings → Backup & restore):

- **Download backup:** one JSON file with every quiz, question, attempt and result. Sessions are not included.
- **Save backup on server:** stored in the database (MongoDB mode) or in `DATA_DIR/backups` (file mode). The newest `MAX_BACKUPS` are kept. For real safety, also use **Download backup** and keep the file elsewhere.
- **Restore from file…** or **Restore** next to a server backup. You must type `RESTORE` to confirm. A `pre-restore` safety backup of the current state is always taken first. The admin account is not replaced unless you include it from the CLI.

**From the command line:**

```bash
cd backend
npm run backup                                  # → saved in the database / DATA_DIR/backups
npm run backup -- /mnt/offsite/quiz-backups     # also copy it somewhere else

# Restore: stop the server first
sudo systemctl stop quiz-platform
npm run restore -- /path/to/backup-file.json            # keeps the current admin
npm run restore -- /path/to/backup-file.json --include-admin
sudo systemctl start quiz-platform
```

**Scheduled backups** (cron, every night at 02:30, keeping copies off the app folder):

```cron
30 2 * * * cd /opt/quiz-platform/backend && DATA_DIR=/var/lib/quiz-platform/data /usr/bin/node src/scripts/backup.js /mnt/backups/quiz >> /var/log/quiz-backup.log 2>&1
```

A plain copy also works: stop the service, then `tar czf quiz-data-$(date +%F).tgz -C /var/lib/quiz-platform data`.
