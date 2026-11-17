# Deployment Guide — MongoDB Atlas + Render + Vercel (Hinglish)

```
Student / Admin browser
        │
        ▼
  Vercel  (React frontend)          ← frontend/ folder
        │   /api/*  (vercel.json rewrite)
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
| `PUBLIC_RATE_MAX_PER_MIN` | `30000` |
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

### 5a. `vercel.json` mein Render ka URL daalo (sabse zaroori step)

`frontend/vercel.json` kholo aur `YOUR-RENDER-SERVICE.onrender.com` ki jagah apna **Render URL** likho (https ke saath, aakhir mein `/` ya `/api` **nahi**):

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://quiz-platform-api-x1y2.onrender.com/api/:path*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Save karke GitHub par push karo:

```bash
git add frontend/vercel.json
git commit -m "set backend url"
git push
```

### 5b. Vercel par project banao

1. <https://vercel.com> → login → **Add New… → Project** → apna repo `quiz-platform` **Import** karo.
2. **Root Directory** → **Edit** → `frontend` chuno. (Ye bhoolna mat!)
3. **Framework Preset:** `Vite` (automatic mil jata hai). Build Command `npm run build`, Output Directory `dist` (default).
4. **Environment Variables:** kuch bhi nahi daalna. (`VITE_API_BASE_URL` khaali chhodo.)
5. **Deploy** dabao. 1–2 minute mein tumhe link milega, jaise `https://quiz-platform-abc.vercel.app`.

---

## Step 6 — Sab kuch test karo

1. Vercel link kholo → `https://quiz-platform-abc.vercel.app/admin/login` par jao.
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

- **Render Free sleep:** 15 minute koi request na aaye to free service so jati hai, aur agli request par jagne mein ~1 minute lagta hai (is dauran students ko error/delay dikh sakta hai). Isse bachne ke liye:
  - **Pakka solution:** Render par Instance Type ko **Starter ($7/month)** kar do — ye kabhi sota nahi.
  - **Free solution:** <https://cron-job.org> ya UptimeRobot jaisi free service se `https://TUMHARA-RENDER-URL/api/health` ko har 10 minute mein ping karwao. Ye kaafi had tak kaam karta hai par guarantee nahi hai. Free plan mein mahine ke 750 instance-hours milte hain; ek service 24×7 chalane par ~744 hours lagte hain, to isi account par dusri free service mat chalao.
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
| Site khulti hai par login/data par "Could not reach the server" ya `/api/...` par 404 | `vercel.json` mein URL placeholder hi hai ya galat hai | `frontend/vercel.json` mein sahi Render URL (https ke saath, aakhir mein slash nahi) daalo, push karo, Vercel redeploy hone do |
| Subpage (jaise `/admin/quizzes`) refresh karne par 404 | `vercel.json` Vercel tak nahi pahunchi, ya Root Directory `frontend` nahi hai | Vercel → Settings → Root Directory = `frontend`, redeploy |
| Pehli request par 504 / lamba loading | Render free sleep se jag raha hai | 1 minute ruk kar refresh. Step 7 ke upay dekho |
| Login `Invalid username or password` | Admin pehle se bana tha aur `ADMIN_*` env sirf tab kaam karta hai jab admin na ho | Atlas → **Browse Collections** → `quizplatform` → `kv` → document `_id: "admin.json"` delete karo → Render **Restart** → admin env wale credentials se dobara ban jayega |
| `Too many failed login attempts` | 10 galat login ke baad 15 min ka block | 15 minute ruk kar sahi password daalo |
| Login ho jata hai par turant wapas login page | Browser cookie save nahi kar raha (aksar tab hota hai jab site Vercel link ki jagah Render link se khuli ho) | Hamesha Vercel link se kholo. Network tab mein `/api/auth/login` Vercel domain par jana chahiye |
| `429 Too many requests` | Rate limit | Render env mein `PUBLIC_RATE_MAX_PER_MIN` / `START_RATE_MAX_PER_10MIN` aur badhao |
| Backend URL badal gaya | Naya Render service banaya | `frontend/vercel.json` mein URL update karke push karo |

---

## Plan B (agar Vercel proxy nahi chahiye)

Browser seedha Render API ko call kare, ye bhi possible hai, lekin **Safari/iPhone aur Brave mein admin login cookie block ho sakti hai**, isliye recommend nahi karte.

- Vercel env: `VITE_API_BASE_URL=https://TUMHARA-RENDER-URL` (aur `vercel.json` se `/api` wala rewrite hata do)
- Render env: `CORS_ORIGIN=https://TUMHARA-VERCEL-URL`, `COOKIE_SAMESITE=none`, `COOKIE_SECURE=true`, `TRUST_PROXY=1`

---

## Local development (apne computer par)

- **Bina database ke:** `backend/.env` mein `MONGODB_URI` khaali rakho; data `backend/data` ke JSON files mein rahega.
- **Atlas ke saath:** `backend/.env` mein `MONGODB_URI` daal do.

```bash
npm run install:all
npm run setup-admin        # admin banao
npm run dev:backend        # terminal 1
npm run dev:frontend       # terminal 2  → http://localhost:5173
```

Tests: `npm test` (file mode). Real MongoDB par storage test: `MONGODB_URI=... npm --prefix backend run test:mongo`.
