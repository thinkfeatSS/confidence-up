# ConfidenceUp — Full Stack Setup Guide

## Project Structure

```
confidence-builder/
├── api/      ← NestJS backend (MySQL + Prisma)
├── app/      ← React Native mobile app
└── web/      ← Next.js admin panel
```

---

## Prerequisites

- Node.js 20+
- MySQL 8.0+
- Android Studio / Xcode (for mobile)

---

## 1. Database Setup

Create a MySQL database:
```sql
CREATE DATABASE confidence_builder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 2. Backend API (`api/`)

### Configure environment
```bash
cp api/.env api/.env.local
```
Edit `api/.env` and fill in:
- `DATABASE_URL` — your MySQL connection string
- `JWT_SECRET` and `JWT_REFRESH_SECRET` — generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` — Web client ID from Google Cloud Console (for mobile Google Sign-In)
- `CRON_SECRET` — required in production; secures `/cron/*` HTTP job endpoints (see `api/scripts/hostinger/`)
- `MAIL_PASSWORD` — Hostinger email password for info@thinkfeat.com
- `FIREBASE_*` — from Firebase Console → Project Settings → Service Accounts

### Run migrations and start
```bash
cd api
npm install
npx prisma migrate dev --name init
npm run start:dev
```

API runs at `http://localhost:3000`
API docs prefix: `/api/v1`

### Create first admin user
After running the app, register a user via the API, then manually update their role in MySQL:
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your-admin@email.com';
```

---

## 3. Admin Panel (`web/`)

### Configure environment
```bash
# web/.env.production — live API (Vercel deploys)
NEXT_PUBLIC_API_URL=https://pink-nightingale-973118.hostingersite.com/api/v1

# web/.env.development or .env.local — local API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

### Run
```bash
cd web
npm install
npm run dev
```

Admin panel runs at `http://localhost:3001`

### Login
Use the admin credentials you set up above.

---

## 4. Mobile App (`app/`)

### API URL (production vs local)

| Build | Env file | API |
|-------|----------|-----|
| **Release APK** | `app/.env` | `https://pink-nightingale-973118.hostingersite.com/api/v1` |
| **Debug** (`run-android`) | `app/.env.development` | `http://10.0.2.2:3000/api/v1` (emulator → local API) |

Edit `app/.env.development` for local backend during development. Release builds use `app/.env` (production).

Physical device on Wi‑Fi: set `API_BASE_URL=http://YOUR_PC_IP:3000/api/v1` in `.env.development`.

### Run
```bash
cd app
npm install
npx react-native run-android
# or
npx react-native run-ios
```

---

## 5. Firebase Push Notifications (Optional — Phase 6 completion)

1. Create a Firebase project at https://console.firebase.google.com
2. Add Android/iOS apps to the Firebase project
3. Download `google-services.json` → place in `app/android/app/`
4. Download `GoogleService-Info.plist` → place in `app/ios/`
5. Install Firebase packages:
   ```bash
   cd app
   npm install @react-native-firebase/app @react-native-firebase/messaging
   cd android && ./gradlew build
   ```
6. Update `src/services/notifications.ts` — uncomment the Firebase code blocks
7. Fill in `api/.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

---

## 6. Google Sign-In (Optional)

1. Enable Google Sign-In in Google Cloud Console
2. Create OAuth 2.0 credentials (Web client ID + Android client)
3. Add to `api/.env`: `GOOGLE_CLIENT_ID` (the **Web** client ID)
4. Add to `app/.env`: `GOOGLE_WEB_CLIENT_ID` (same Web client ID as above)
5. Install in mobile app:
   ```bash
   npm install @react-native-google-signin/google-signin
   ```
6. Follow setup guide: https://react-native-google-signin.github.io/docs/setting-up/get-config-file

Mobile flow: app obtains a Google `idToken` → `POST /auth/google/mobile` → API verifies token and returns `{ user, accessToken, refreshToken }`.

---

## 7. Scheduled jobs on Hostinger

On Hostinger Business Node.js hosting, use **hPanel cron jobs** to hit secured API endpoints instead of relying on in-process schedulers.

1. Set in production `api/.env`: `NODE_ENV=production`, `CRON_SECRET=<random-32-chars>`, `CRON_INTERNAL_ENABLED=false`
2. Follow `api/scripts/hostinger/README.md` to upload `run-cron.sh` and create 5 cron entries (daily mission, streak reset, reminders, weekly emails)

Cron endpoints (POST, header `X-Cron-Secret`):

| Endpoint | Schedule (UTC) |
|----------|----------------|
| `/cron/daily-mission` | Daily 00:05 |
| `/cron/reset-streaks` | Daily 00:00 |
| `/cron/streak-reminders` | Daily 08:00 |
| `/cron/mission-reminders` | Daily 09:00 |
| `/cron/weekly-reports` | Monday 09:00 |

---

## API Endpoints Summary

Base URL (production): `https://pink-nightingale-973118.hostingersite.com/api/v1`  
Local dev: `http://localhost:3000/api/v1`

All responses are wrapped: `{ success: boolean, data: T, timestamp: string }`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/verify-email | Verify OTP |
| POST | /auth/verify-email/resend | Resend OTP |
| POST | /auth/login | Login |
| POST | /auth/google/mobile | Google Sign-In (mobile idToken → JWT) |
| POST | /auth/forgot-password | Send reset OTP |
| POST | /auth/reset-password | Reset password |
| POST | /auth/refresh | Refresh tokens |
| POST | /auth/logout | Logout |
| GET | /auth/me | Current user |

### User Features (all require Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/PATCH | /users/me | Profile |
| POST | /users/me/onboarding | Save quiz |
| GET | /missions | List missions |
| GET | /missions/today | Daily mission |
| POST | /missions/:id/complete | Complete mission |
| POST | /missions/:id/bookmark | Toggle bookmark |
| GET | /challenges | List challenges |
| POST | /challenges/:id/start | Start challenge |
| POST | /challenges/:id/complete | Complete challenge |
| GET | /fears | Fear categories |
| POST | /fears/me/:id/complete | Complete fear level |
| GET/POST/PATCH/DELETE | /journal | Journal entries |
| POST | /speech/sessions | Save practice session |
| GET | /gamification/me/xp | XP + level |
| POST | /gamification/me/checkin | Daily check-in |
| GET | /gamification/me/streak | Streak |
| GET | /badges | All badges |
| GET | /badges/me | My badges |
| GET | /analytics/me/progress | Progress charts |
| GET | /notifications | Notification inbox |
| POST | /notifications/read-all | Mark all read |
| GET | /announcements/active | Active announcements |
| POST | /support/tickets | Create support ticket |
| POST | /feedback | Submit feedback |
| GET | /referral/me/code | My referral code |
| POST | /referral/apply | Apply referral code |

### Admin Endpoints (require ADMIN role)
All admin endpoints are prefixed with the resource path + `/admin/`

---

## Architecture

```
Mobile App (React Native)
    ↓ JWT Bearer token
NestJS API (api/)
    ↓ Prisma ORM
MySQL Database
    ↓ firebase-admin
FCM Push Notifications
    ↓ nodemailer
Hostinger SMTP (info@thinkfeat.com)

Admin Panel (Next.js web/)
    ↓ JWT cookie
NestJS API (api/) — same backend
```

## Static Data (app-side only — no API needed)
- Confidence level labels: Novice, Apprentice, Practitioner, Adept, Expert, Specialist, Master, Grandmaster, Elite, Legend
- Navigation structure and tab names
- System role display names (User, Admin)
