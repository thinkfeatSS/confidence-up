# Truefluent AI — Full Stack Setup Guide

## Project Structure

```
confidence-builder/
├── ai-sevices/ ← Unified FastAPI backend (MySQL + SQLAlchemy + Celery + Ollama AI)
├── app/        ← Truefluent AI React Native mobile app
└── web/        ← Truefluent AI Next.js web admin portal
```

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- MySQL 8.0+ / Redis 7+
- Android Studio / Xcode (for mobile development)

---

## 1. Unified FastAPI Backend (`ai-sevices/`)

The backend is a unified FastAPI service handling all API endpoints for both the Mobile App and the Web Admin Portal, including Atlas AI Coach (Ollama Llama 3.2), speech analysis, gamification, and Celery asynchronous background tasks.

### Architecture

```
Mobile App (React Native)       Web Admin Portal (Next.js)
         \                             /
          \                           /
           ▼                         ▼
   HTTPS (https://speakupmic.binaryunit.tech/api/v1)
                    │
                    ▼
          Nginx Reverse Proxy
                    │
                    ▼
         Unified FastAPI Backend
        (ai-sevices/app - Port 8006)
          │            │           │
          ▼            ▼           ▼
     MySQL Database  Redis     Ollama (Llama 3.2 3B)
          ▲            ▲
          │            │
      Celery Background Worker
```

### Configure Environment
Copy `.env.example` to `.env` in `ai-sevices/`:
```bash
cp ai-sevices/.env.example ai-sevices/.env
```
Key configuration values:
- `DATABASE_URL`: `mysql+pymysql://<user>:<pass>@<host>:<port>/<dbname>`
- `REDIS_URL`: `redis://localhost:6379/0`
- `SECRET_KEY`: JWT secret key
- `OLLAMA_BASE_URL`: `http://localhost:11434`
- `OLLAMA_MODEL`: `llama3.2:3b`
- `CRON_SECRET`: Secret header key for scheduled cron endpoints (`X-Cron-Secret`)
- `SMTP_USER` / `SMTP_PASSWORD`: SMTP mail configuration for transactional emails

### Running Locally with Docker Compose
```bash
docker compose up -d --build
```

### Running Locally with Python
```bash
cd ai-sevices
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8006 --reload
```

Interactive API documentation available at `http://localhost:8006/docs`.

---

## 2. Web Admin Portal (`web/`)

Next.js application providing analytics, user management, fear categories, missions, challenges, device version management, and audit logs.

### Configure Environment
- Production: `NEXT_PUBLIC_API_URL=https://speakupmic.binaryunit.tech/api/v1`
- Local development: `NEXT_PUBLIC_API_URL=http://localhost:8006/api/v1`

### Run
```bash
cd web
npm install
npm run dev
```
Runs at `http://localhost:3001` or `http://localhost:3000`.

---

## 3. Mobile App (`app/`)

React Native mobile application for Truefluent AI speech confidence coaching.

### API URL
- Production (`app/.env`): `API_BASE_URL=https://speakupmic.binaryunit.tech/api/v1`
- Development (`app/.env.development`):
  - Emulator: `http://10.0.2.2:8006/api/v1`
  - Physical Device: `http://<YOUR_PC_IP>:8006/api/v1`

### Run
```bash
cd app
npm install
npx react-native run-android
# or
npx react-native run-ios
```

---

## 4. Scheduled Maintenance & Cron Jobs

Automated maintenance tasks can be triggered using POST requests with the `X-Cron-Secret` header:

| Endpoint | Description |
|----------|-------------|
| `/api/v1/cron/daily-mission` | Rotates the daily featured challenge/mission |
| `/api/v1/cron/reset-streaks` | Resets inactive streaks |
| `/api/v1/cron/streak-reminders` | Dispatches reminder notifications |
| `/api/v1/cron/mission-reminders` | Dispatches daily mission notifications |
| `/api/v1/cron/weekly-reports` | Compiles and sends weekly progress reports |

---

## 5. API Endpoints Summary

Base URL (Production): `https://speakupmic.binaryunit.tech/api/v1`

All responses follow standard REST patterns wrapped in `{ success: boolean, data: T, timestamp: string }`.

### Core Routes
- **Auth**: `/auth/register`, `/auth/login`, `/auth/me`, `/auth/refresh`, `/auth/google/mobile`, `/auth/verify-email`, `/auth/forgot-password`, `/auth/reset-password`
- **Users**: `/users/me`, `/users/me/onboarding`, `DELETE /users/me`, `/users/admin`
- **Coach**: `/coach/chat` (Ollama AI Atlas Coach)
- **Speech**: `/speech/sessions`, `/speech/analyze`
- **Gamification**: `/gamification/me/xp`, `/gamification/me/checkin`, `/gamification/me/streak`
- **Missions & Challenges**: `/missions`, `/missions/today`, `/challenges`, `/challenges/me/active`
- **Fears**: `/fears`, `/fears/me/:id/complete`
- **Journal**: `/journal` (CRUD)
- **Badges**: `/badges`, `/badges/me`
- **Devices**: `/devices/check-version`, `/devices/admin/versions`
- **Audit**: `/audit/logs`
- **Cron**: `/cron/*`
