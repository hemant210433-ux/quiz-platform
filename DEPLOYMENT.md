# Deployment Guide — MongoDB Atlas + Render + Vercel (Hinglish)

```
Student / Admin browser
        │
        ▼
  Vercel  (Next.js frontend)         ← frontend/ folder
        │   /api/*  (next.config.js rewrite, BACKEND_URL)
        ▼
  Render  (Express backend)         ← backend/ folder
        │
        ▼
  MongoDB Atlas  (database)
```

**Ye setup kyun?** Render ka free filesystem har restart/deploy par saaf ho jata hai, isliye data database (Atlas) mein rakha hai. Vercel `/api` ko Render par bhej deta hai, isliye browser ko sirf ek hi domain dikhta hai. Is wajah se CORS ki dikkat nahi aati aur admin login cookie Safari/iPhone/Brave mein bhi chalti hai.

Tumhe 4 free accounts chahiye: **GitHub, MongoDB Atlas, Render, Vercel.** (Sab par "Sign up with GitHub" se jaldi ban jata hai.)

> Note: In websites ke buttons/menu ke naam kabhi-kabhi thode badal jate hain. Agar koi naam bilkul same na mile to usse milta-julta option chuno.

---

## Pehle se deploy hai? Purane React project ko isi Render + Vercel par upgrade karo

Agar tumne purana quiz platform (React/Vite) pehle se Render aur Vercel par chalaya hua hai, to **naya account/project banane ki zaroorat nahi.** Wahi GitHub repo, wahi Render service, wahi Vercel project, wahi Atlas database (tumhara purana data aur admin login safe rehta hai).

**1. Code replace karo (apne computer par)**
```bash
cd apna-repo-folder
git rm -r --quiet frontend          # purana Vite frontend hatao (zaroori!)
# naya zip extract karo, phir uske andar ke backend/ frontend/ docs/ render.yaml README.md DEPLOYMENT.md
# ... in sabko apne repo mein copy kar do (backend ka .env / data mat copy karna)
git add -A
git commit -m "Next.js frontend + O Level public site"
git push
```
Agar `frontend/vercel.json`, `index.html`, `vite.config.js` repo mein reh gaye to Vercel confuse hoga — ye sab nayi `frontend/` mein hain hi nahi, isliye `git rm -r frontend` pehle karna zaroori hai.

**2. Vercel (sabse zaroori step — yahan purani settings ruk jati hain)**
Project → **Settings → Build & Development Settings**:
- **Framework Preset:** `Next.js` (pehle `Vite` tha)
- **Build Command / Output Directory / Install Command:** teeno ke saamne **Override band** rakho (khaali/default). Purana `dist` Output Directory ho to hata do, warna deploy fail hoga.
- **Root Directory:** `frontend` (pehle se hoga)

**Settings → Environment Variables** mein add karo (purane `VITE_...` variables hata sakte ho):
| Name | Value |
|---|---|
| `BACKEND_URL` | tumhara Render URL, jaise `https://quiz-platform-api-xxxx.onrender.com` (aakhir mein `/` nahi) |
| `NEXT_PUBLIC_SITE_URL` | `https://olevelmocktest.in` (ya abhi ke liye Vercel ka link) |

Phir **Deployments → ⋯ → Redeploy** karo aur **"Use existing Build Cache" ka tick hata do.**

**3. Render**
Kuch badalne ki zaroorat nahi: `git push` se backend khud redeploy ho jata hai (Auto-Deploy on). `MONGODB_URI` waise hi rehta hai. Deploy ke baad `https://TUMHARA-RENDER-URL/api/health` kholkar `"status":"ok"` dekho.
> Naya backend purana data waise hi padhta hai. Naye fields (module/topic) optional hain, isliye purane quizzes bina badlaav ke chalte hain.

**4. Check:** Vercel link kholo → naya home page dikhna chahiye. `/admin/login` se login karo, aur purane quiz links (`/quiz/...`) pehle jaise khulne chahiye.

---

## Step 1 — Code GitHub par daalo

1. GitHub par naya **private repository** banao (naam: `quiz-platform`). README/.gitignore add **mat** karo.
2. Project folder (jisme `backend`, `frontend`, `render.yaml` hai) mein terminal kholo:

```bash
git init
git add .
git commit -m "quiz platform"
git branch -M main
git remote add origin https://github.com/TUMHARA-USERNAME/quiz-platform.git
git push -u origin main
```

`.gitignore` pehle se `node_modules`, `.env` aur `backend/data` (tumhara purana local data) ko bahar rakhta hai, isliye wo GitHub par nahi jayenge.

---

## Step 2 — MongoDB Atlas (database)

1. <https://www.mongodb.com/cloud/atlas/register> par account banao.
2. **Create a deployment / Build a Database** → plan **M0 (Free)** → Provider **AWS** → Region **Singapore (ap-southeast-1)** (Render ka Singapore region isi ke paas hai, isliye fast rahega) → **Create**.
3. **Database Access** (ya "Security → Database Access") → **Add New Database User**:
   - Username: `quizuser`
   - Password: **sirf letters aur numbers** wala (jaise `Quiz2026Secure99`). `@ : / ? #` jaise special characters **mat** rakho, warna connection error aata hai.
   - Role: *Read and write to any database* → **Add User**.
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`) → **Confirm**.
   (Render ke IP badalte rehte hain, isliye ye zaroori hai. Security tumhare strong password se aati hai.)
5. **Database / Clusters** page → **Connect** → **Drivers** → **Node.js** → connection string copy karo. Aisi dikhegi:

```
mongodb+srv://quizuser:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
```

6. `<password>` ko apne asli password se replace karo (`<` `>` hata do). Ye final string **MONGODB_URI** hai — isse sambhal kar rakho, kisi ko share mat karo.

---

## Step 3 (optional) — Purana local data Atlas mein daalo

Agar tumhare local `backend/data` mein quizzes/results hain jo chahiye, to ye **ek baar** apne computer se chalao (Node.js 20+ installed ho):

```bash
cd quiz-platform
npm run install:all
```

**Windows PowerShell:**
```powershell
$env:MONGODB_URI="mongodb+srv://quizuser:PASSWORD@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority"
npm run migrate-to-mongo
```

**Mac / Linux / Git Bash:**
```bash
MONGODB_URI="mongodb+srv://quizuser:PASSWORD@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority" npm run migrate-to-mongo
```

Output mein dikhna chahiye: `Done. Imported N files (X quizzes). Admin account "admin" imported.`
Is case mein tumhara purana admin username/password hi online bhi chalega, aur Render par `ADMIN_USERNAME/ADMIN_PASSWORD` set karne ki zaroorat nahi.

Agar purana data nahi chahiye, to ye step skip karo.

---

## Step 4 — Render (backend)

1. <https://render.com> → login → **New +** → **Web Service** → apna GitHub repo `quiz-platform` chuno (pehli baar GitHub access dena padega).
2. Settings bharo:

| Field | Value |
|---|---|
| Name | `quiz-platform-api` (koi bhi naam) |
| Region | **Singapore** |
| Branch | `main` |
| **Root Directory** | `backend` |
| Runtime | `Node` |
| **Build Command** | `npm ci` |
| **Start Command** | `npm start` |
| Instance Type | **Free** |

3. **Advanced** → **Health Check Path** = `/api/health`
4. **Environment Variables** mein ye add karo:

| Key | Value |
|---|---|
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | *(Step 2 ki connection string)* |
| `MONGODB_DB` | `quizplatform` |
| `SERVE_FRONTEND` | `false` |
| `TRUST_PROXY` | `1` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `lax` |
| `PUBLIC_RATE_MAX_PER_MIN` | `30000` (optional; ab limit har student ke asli IP par lagti hai) |
| `START_RATE_MAX_PER_10MIN` | `5000` |
| `ADMIN_USERNAME` | `admin` *(sirf agar Step 3 nahi kiya)* |
| `ADMIN_PASSWORD` | *kam se kam 10 characters, letters + numbers dono* *(sirf agar Step 3 nahi kiya)* |

5. **Create Web Service** dabao. Deploy mein 2–5 minute lagte hain. Logs mein ye lines aani chahiye:

```
Connected to MongoDB.
Admin account created from ADMIN_USERNAME / ADMIN_PASSWORD.     (sirf pehli baar)
Quiz Platform API listening on ...
```

6. Render upar tumhe URL dega, jaise `https://quiz-platform-api-x1y2.onrender.com`. Browser mein kholo:

```
https://quiz-platform-api-x1y2.onrender.com/api/health
```

Ye dikhna chahiye: `{"status":"ok", ...}`. **Jab tak ye na dikhe, aage mat badho** (neeche "Errors aur unke hal" dekho).

> Shortcut: repo mein `render.yaml` bhi hai. Render → **New + → Blueprint** se bhi ye sab settings apne-aap bhar sakti hain; tab bas `MONGODB_URI`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` dashboard mein daalna padega.

---

## Step 5 — Vercel (frontend)

### 5a. Vercel par project banao

1. <https://vercel.com> → login → **Add New… → Project** → apna repo **Import** karo.
2. **Root Directory** → **Edit** → `frontend` chuno. (Ye bhoolna mat!)
3. **Framework Preset:** `Next.js` (automatic mil jata hai). Build/Output settings default rehne do. (Pehle `Vite` tha — ab nahi.)
4. **Environment Variables** (dono daalo):

| Name | Value | Kyun |
|---|---|---|
| `BACKEND_URL` | `https://TUMHARA-RENDER-URL.onrender.com` (https ke saath, aakhir mein `/` ya `/api` **nahi**) | Vercel `/api/*` ko yahan bhejta hai (proxy). **Ye na ho to build hi fail ho jata hai, saaf message ke saath.** |
| `NEXT_PUBLIC_SITE_URL` | `https://olevelmocktest.in` (ya abhi ke liye Vercel link) | Sitemap, robots, canonical links ke liye |
| `NEXT_PUBLIC_CONTACT_EMAIL` (optional) | tumhara email | Contact page par dikhega |

5. **Deploy** dabao. 1–2 minute mein link milega, jaise `https://quiz-platform-abc.vercel.app`.

> Ab `frontend/vercel.json` nahi hai — proxy `frontend/next.config.js` mein hai aur `BACKEND_URL` se chalta hai. Render URL badla to sirf Vercel env `BACKEND_URL` badlo aur **Redeploy** karo.

### 5b. Custom domain (olevelmocktest.in)

Vercel → Project → Settings → Domains → domain add karo, aur registrar mein jo DNS record Vercel batata hai wahi daalo. Domain chalne ke baad `NEXT_PUBLIC_SITE_URL` ko `https://olevelmocktest.in` karke **Redeploy** karo, phir Google Search Console mein `https://olevelmocktest.in/sitemap.xml` submit karo.

---

## Step 6 — Sab kuch test karo

1. Vercel link kholo → pehle home page (`/`) dikhega; admin ke liye `/admin/login` par jao.
   *(Agar pehli baar page der se khule to Render so raha tha — 1 minute ruko, phir refresh karo.)*
2. Admin login karo (Step 3 wala purana ya `ADMIN_USERNAME/ADMIN_PASSWORD`).
3. Naya quiz banao → MCQs import karo → Publish karo.
4. Quiz ka student link copy karo, **incognito window** mein kholo, naam daal kar quiz do aur submit karo.
5. Admin panel mein Results dekho.
6. **Asli restart test:** Render dashboard → **Manual Deploy → Deploy latest commit** (ya Restart). Deploy hone ke baad admin panel mein quiz aur result abhi bhi dikhne chahiye. ✅ (Ye database ka asli fayda hai.)
7. **Settings** page mein "public base URL" mein apna Vercel link daalna ho to daal do.

Quiz link hamesha **Vercel wala link** share karo, Render wala nahi.

---

## Step 7 — Exam wale din ke liye zaroori baatein

- **Render Free sleep (server baar-baar so jana):** Render free service 15 minute koi request na aaye to so jati hai, aur jagne mein ~1 minute lagta hai. Is project mein ab iske **3 layers** hain:
  1. **Khud ko jagaye rakhna (code mein, kuch setup nahi):** backend har 10 minute mein apne hi public URL (`RENDER_EXTERNAL_URL`, Render khud set karta hai) ko ping karta hai, to jagne ke baad wo so nahi pata. Band karna ho (jaise Starter plan par) to Render env mein `KEEP_ALIVE=false`.
  2. **Bahari monitor (zaroori backup):** upar wali self-ping sirf *jage hue* server ko jagaye rakhti hai; deploy/crash ke baad agar server so gaya to wo use utha nahi sakti. Isliye free **UptimeRobot** (<https://uptimerobot.com>) lagao: *Add New Monitor → HTTP(s) → URL* `https://TUMHARA-RENDER-URL/api/health` → *interval 5 minutes* → Create. Ye har 5 minute mein ping karke kabhi sone nahi deta (aur server down hone par email bhi bhejta hai).
  3. **Website khud intezaar karti hai:** agar phir bhi server so gaya ho, to ab student ko error nahi dikhta. Page khulte hi site server ko jagana shuru kar deti hai, aur "सर्वर चालू हो रहा है…" ka peela banner dikhakar jagne ka intezaar karti hai, phir request khud dobara bhejti hai.
  - **Public pages (home, module pages) Vercel se serve hote hain**, isliye Render sote hue bhi khulte hain; sirf quiz shuru/submit aur admin ko backend chahiye.
  - **100% pakka solution:** Render par Instance Type **Starter ($7/month)** kar do — wo kabhi nahi sota. Exam season mein ya zyada students hon to yahi lo. Free plan mein mahine ke 750 instance-hours milte hain; ek service 24×7 chalane par ~744 lagte hain, to isi account par dusri free service mat chalao.
  - Ye free tarike *koshish* hain, Render ki guarantee nahi — Render kabhi bhi free tier ke rules badal sakta hai.
  - Exam se 5 minute pehle khud ek baar site khol lo taaki server jaag jaye.
- **Backup:** Atlas free (M0) mein automatic backup nahi hota. Exam ke baad **Settings → Download backup** se ek file apne computer par rakh lo.
- **Free limit:** Atlas M0 mein 512 MB milta hai. Hazaron students ke results bhi isme aaram se aa jate hain.

---

## Errors aur unke hal

| Dikkat | Kaaran | Hal |
|---|---|---|
| Render deploy fail: `Cannot find package.json` | Root Directory galat | Render → Settings → Root Directory = `backend` |
| Render logs: `MongoServerSelectionError` / `ECONNREFUSED` / `timed out` | Atlas Network Access mein IP allow nahi | Atlas → Network Access → `0.0.0.0/0` add karo, 1–2 min ruko, Render restart |
| Render logs: `bad auth` / `Authentication failed` | Password galat ya URI mein `<password>` waise hi likha hai / special character | Atlas → Database Access → user ka password reset karo (sirf letters+numbers), URI update karke Render env mein save karo |
| Render logs: `Invalid scheme` ya `URI malformed` | `MONGODB_URI` mein space/quote ya galat copy | Render env value mein sirf `mongodb+srv://...` rakho, quotes mat lagao |
| `/api/health` par `503 Storage unavailable` | Database se connect nahi ho paa raha | Upar wale 3 Mongo errors check karo |
| Site khulti hai par login/data par "Could not reach the server" ya `/api/...` par 404 | Vercel env `BACKEND_URL` galat/khaali hai ya Render so raha hai | Vercel → Settings → Environment Variables mein sahi `BACKEND_URL` daalo (https ke saath, aakhir mein slash nahi), **Redeploy** karo |
| Vercel build fail: `[BACKEND_URL missing]` | Env var set nahi kiya | Step 5a ka `BACKEND_URL` daalo, redeploy |
| Subpage (jaise `/admin/quizzes`) par 404 | Root Directory `frontend` nahi hai ya Framework Preset `Next.js` nahi | Vercel → Settings → Root Directory = `frontend`, Framework = Next.js, redeploy |
| Home / module pages par "abhi koi test nahi" dikhta hai jabki quiz publish hai | Build ke samay Render so raha tha; pages har 5 min mein refresh hote hain | 5–10 minute ruko ya Vercel se Redeploy karo. Render ko Starter plan par rakhne se ye dikkat nahi aati |
| Pehli request par 504 / lamba loading | Render free sleep se jag raha hai | 1 minute ruk kar refresh. Step 7 ke upay dekho |
| Login `Invalid username or password` | Admin pehle se bana tha aur `ADMIN_*` env sirf tab kaam karta hai jab admin na ho | Atlas → **Browse Collections** → `quizplatform` → `kv` → document `_id: "admin.json"` delete karo → Render **Restart** → admin env wale credentials se dobara ban jayega |
| `Too many failed login attempts` | 10 galat login ke baad 15 min ka block | 15 minute ruk kar sahi password daalo |
| Login ho jata hai par turant wapas login page | Browser cookie save nahi kar raha (aksar tab hota hai jab site Vercel link ki jagah Render link se khuli ho) | Hamesha Vercel link se kholo. Network tab mein `/api/auth/login` Vercel domain par jana chahiye |
| `429 Too many requests` | Rate limit | Render env mein `PUBLIC_RATE_MAX_PER_MIN` / `START_RATE_MAX_PER_10MIN` aur badhao |
| Backend URL badal gaya | Naya Render service banaya | Vercel env `BACKEND_URL` update karke Redeploy |

---

## Plan B (agar Vercel proxy nahi chahiye)

Browser seedha Render API ko call kare, ye bhi possible hai, lekin **Safari/iPhone aur Brave mein admin login cookie block ho sakti hai**, isliye recommend nahi karte.

- Vercel env: `NEXT_PUBLIC_API_BASE_URL=https://TUMHARA-RENDER-URL`
- Render env: `CORS_ORIGIN=https://TUMHARA-VERCEL-URL`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, `TRUST_PROXY=1`

---

## Local development (apne computer par)

- **Bina database ke:** `backend/.env` mein `MONGODB_URI` khaali rakho; data `backend/data` ke JSON files mein rahega.
- **Atlas ke saath:** `backend/.env` mein `MONGODB_URI` daal do.

```bash
npm run install:all
npm run setup-admin        # admin banao
npm run dev:backend        # terminal 1
npm run dev:frontend       # terminal 2  → http://localhost:3000  (frontend/.env.local mein BACKEND_URL=http://localhost:4000)
```

Tests: `npm test` (file mode). Real MongoDB par storage test: `MONGODB_URI=... npm --prefix backend run test:mongo`.
