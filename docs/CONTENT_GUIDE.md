# Content guide — O Level Mock Test

## Rules (please keep)
1. **Only add questions you wrote yourself or have the right to use.** Do not copy real exam papers or other sites' question banks.
2. Never use the NIELIT logo, name styling or anything that looks official. The footer disclaimer must stay.
3. Do not state an "official pattern" (number of questions, time, marking). Quiz duration/marks are your own practice settings.
4. Mark sample/test content clearly as **[DEMO]** and do not publish it.

## Workflow (per quiz)
1. Admin → **Create quiz**. Fill title, duration, marks. Under **Public website (optional)** choose the **Module**, optionally Topic / Year / SEO title / SEO description (~150 chars, Hindi is fine).
2. Admin → **Import questions** → paste text in this format (Hindi or English):

```
Q1. प्रश्न का पाठ
A. विकल्प 1
B. विकल्प 2
C. विकल्प 3
D. विकल्प 4
Answer: B
Topic: Operating Systems
Explanation: छोटा सा कारण (वैकल्पिक)
```
`Topic:` / `विषय:` is optional but powers the student's **weak-topics report**. Use the same spelling for the same topic everywhere.
3. Fix any errors shown in the preview, save, then **Publish**. Only published quizzes with at least one question AND a Module chosen appear on the public site. Quizzes without a Module (e.g. for your institute) stay private-link only: they are never listed on the home page, module pages or sitemap.
4. Public pages refresh every ~5 minutes (sitemap ~10 minutes).

## JSON import
Same fields as before plus optional `"topic": "..."` per question.

## Topic names: use the official NIELIT unit names
Use the same unit names in the `Topic:` line (and the quiz's Topic field). The weak-topic report then matches what students see on the syllabus page. Units follow the NIELIT O Level R5 syllabus (check NIELIT for revisions):
- **M1-R5** Introduction to Computer · Introduction to Operating System · Word Processing · Spreadsheet · Presentation · Introduction to Internet and WWW · E-mail, Social Networking and e-Governance Services · Digital Financial Tools and Applications · Overview of FutureSkills & Cyber Security
- **M2-R5** Introduction to Web Design · Editors · HTML Basics · Cascading Style Sheets (CSS) · CSS Framework · JavaScript and Angular JS · Photo Editor · Web Publishing and Browsing
- **M3-R5** Introduction to Programming · Algorithm and Flowcharts to solve problems · Introduction to Python · Operators, Expressions and Python Statements · Sequence data types · Functions · File Processing · Modules · NumPy Basics
- **M4-R5** Introduction to IoT · Things and Connections · Sensors, Actuators and Microcontrollers · Building IoT Applications · Security and Future of IoT Ecosystem · Soft skills – Personality Development

## Search (SEO) – what to write so students can find a quiz
Students search in English letters even for Hindi tests ("o level m1 r5 mock test", "o level online test hindi"). So:
- **Quiz title:** `M1-R5 Mock Test 1 – Computer Basics (Hindi)`. Put the module code first, then the unit name. Avoid vague titles like "Test 5".
- **Module:** always choose it. A quiz with no Module is treated as private: it is hidden from the public lists and the sitemap, and marked noindex.
- **SEO title** (optional): ≤ 60 characters. **SEO description** (optional): 120–155 characters, say what it covers (number of questions, topic), in plain words.
- **Description:** one honest line. No "real exam paper", "100% common", "official" or "NIELIT paper" claims.
- Several smaller unit-wise quizzes (10–25 questions) rank and convert better than a few huge ones, and they feed the weak-topic report.
- Do not repeat the same keywords many times in one title. Search engines ignore it and students find it spammy.

## Page-1 checklist before going live
- [ ] ≥ 1 published quiz per module (empty modules show a "coming soon" note)
- [ ] `NEXT_PUBLIC_SITE_URL` set to the real domain; sitemap submitted in Google Search Console
- [ ] `NEXT_PUBLIC_CONTACT_EMAIL` set
- [ ] Privacy / About text reviewed by you
- [ ] Render on Starter plan (or kept awake) for exam season
