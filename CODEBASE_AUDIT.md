# CODEBASE AUDIT: ConfidenceUp / Confidence Builder

**Date**: 2026-08-15  
**Version**: 1.0.0  
**Scope**: Full Stack Repository Audit (React Native App, NestJS API, Python AI Service, Database, Infrastructure, Speech & AI Pipeline)

---

## 1. Executive Summary

The **ConfidenceUp** platform is a mobile-first speaking confidence coaching application designed for students and users looking to overcome speaking anxiety and build vocal confidence.

The repository currently consists of:
- **`app/`**: React Native (v0.85.3, React 19.2.3) mobile application with TypeScript, React Navigation 7, Reanimated 4, and `@tanstack/react-query`.
- **`api/`**: NestJS backend service with Prisma ORM connecting to MySQL (`confidence_builder`), JWT auth, Google OAuth, Gamification, and Gemini AI integration.
- **`ai-sevices/`**: A newly initialized Python virtual environment intended for the new FastAPI AI & Speech Processing service.
- **`web/`**: Next.js 14 admin management dashboard for content, users, and analytics.

---

## 2. Current Architecture & Component Inventory

```
┌─────────────────────────────────────────────────────────────┐
│                   React Native App (app/)                   │
│  - Screens: SpeakingPracticeScreen, ProgressScreen, etc.     │
│  - @dev-amirzubair/react-native-voice (Google STT Client)   │
│  - Client NLP: wink-nlp + wink-eng-lite-web-model           │
│  - Client Audio Metering: speech volume event samples       │
│  - Client Deterministic Confidence Engine                   │
└──────────────┬───────────────────────────────┬──────────────┘
               │ HTTPS (POST /speech/sessions) │ HTTPS (POST /speech/analyze-ai)
               ▼                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     NestJS API (api/)                       │
│  - Modules: auth, speech, gamification, analytics, coach... │
│  - Database ORM: Prisma Client (MySQL)                      │
│  - Gemini AI Integration: @google/generative-ai (REST)      │
│  - Auth: JWT (15m Access Token, 7d Refresh Token in DB)      │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 MySQL Database (Prisma ORM)                 │
│  - users, speech_sessions, daily_checkins, user_badges...   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Component Audit

### 3.1 Mobile Application (`app/`)

- **Core Dependencies**:
  - `react-native`: 0.85.3
  - `react`: 19.2.3
  - `@dev-amirzubair/react-native-voice`: 1.0.4 (Client-side STT wrapper)
  - `wink-nlp`: 2.4.0 & `wink-eng-lite-web-model`: 1.8.1 (Client-side English NLP)
  - `@tanstack/react-query`: 5.100.14
  - `react-native-reanimated`: 4.3.1
  - `react-native-svg`: 15.15.5
  - `@react-native-google-signin/google-signin`: 16.1.2
  - `@react-native-firebase/app` & `@react-native-firebase/messaging`: 25.1.0

- **Speech Flow**:
  1. `useSpeechRecorder.ts`: Listens to microphone through `@dev-amirzubair/react-native-voice`. Collects raw volume metering events into `samplesRef` and accumulates transcript partials.
  2. `nlpService.ts` & `nlpIntelligence.ts`: Runs `wink-nlp` on the recognized text, extracting tokens, sentences, vocabulary richness, repetition score, hedging words, and transition words.
  3. `audioAnalysisService.ts` & `audioIntelligence.ts`: Analyzes volume samples from `onSpeechVolumeChanged` to estimate average volume, pause intervals (natural/thinking/lost), rhythm, and speech rate.
  4. `languageDetector.ts` & `languageIntelligence.ts`: Script ratio matching (Latin, Arabic/Urdu, Devanagari) + dictionary lookups for English, Urdu, Hindi, Sindhi, and Roman Urdu.
  5. `speechAnalysisPipeline.ts`: Combines local NLP + audio metrics + language detection + Gemini AI (via `geminiService.ts` / NestJS proxy) to produce confidence components.
  6. `SpeakingPracticeScreen.tsx`: Displays live recording waveform, timer, and live transcript. On stop, runs the full analysis pipeline, posts payload to `POST /speech/sessions`, triggers gamification celebrations (XP, level up, badges), and presents results.

- **Identified Limitations in Current Mobile Flow**:
  - `@dev-amirzubair/react-native-voice` relies on on-device Google Speech Recognition on Android / Apple Dictation on iOS. This results in inconsistent STT quality across Android devices, poor support for mixed-language code switching (Urdu-English, Sindhi-English), and failure in noisy environments.
  - The mobile app does NOT currently record or save audio files (`.m4a`/`.wav`), so raw audio cannot be verified, re-analyzed, or processed with Whisper.
  - Client-side heavy computation of NLP and audio metrics drains battery and slows down older devices.

### 3.2 Backend Service (`api/` - NestJS)

- **Architecture**: NestJS modular application with controllers, services, guards, and DTOs.
- **Database & ORM**: Prisma ORM targeting MySQL with tables:
  - `users`: Core profile, XP total, level, confidence score, referral code.
  - `speech_sessions`: Stores transcript, language detected, word count, filler count, vocabulary richness, repetition score, speech speed WPM, fluency score, topic relevance, overall confidence score, duration, XP, JSON fields (`languageMix`, `coachingFeedback`, `personalizedSuggestions`, `confidenceComponents`, `localMetrics`, `aiInsights`, `fillerBreakdown`).
  - `gamification` (`streaks`, `daily_checkins`, `badges`, `user_badges`, `xp_transactions`).
  - `content` (`missions`, `user_missions`, `daily_missions`, `challenges`, `fear_categories`, `skill_nodes`).
- **AI Integration**:
  - `ollama.util.ts`: Communicates with Ollama LLM (`llama3.2:3b`) for AI coaching and semantic topic relevance.
  - `speech.service.ts`: `analyzeWithAi` endpoint and fallback offline logic.

### 3.3 Python Service (`ai-sevices/`)

- **Current State**: Virtual environment (`.venv`) created with `fastapi[standard]` installed.
- **Target Responsibility**: Houses the Speech Engine (FFmpeg, `faster-whisper`), Deterministic Analytics Engine, Hybrid Multilingual Engine, Ollama Coaching Engine, and Deterministic Confidence Engine.

---

## 4. Current Data Models & Schema Compatibility

The existing `SpeechSession` model in Prisma already has rich JSON and scalar fields:
- `id`, `userId`, `transcript`, `topic`, `languageDetected`, `wordCount`, `sentenceCount`, `fillerCount`, `vocabularyRichness`, `repetitionScore`, `averageVolume`, `pauseFrequency`, `speechSpeedWpm`, `fluencyScore`, `topicRelevanceScore`, `overallConfidenceScore`, `durationSeconds`, `xpEarned`, `languageMix`, `confidenceComponents`, `localMetrics`, `aiInsights`, `fillerBreakdown`, `coachingFeedback`, `personalizedSuggestions`, `miniMission`, `analysisMeta`, `missionId`, `challengeId`, `createdAt`.

**Compatibility Note**:
The schema aligns with the target session data requirements. We will add relational tables/extensions for asynchronous job processing, audio file metadata, and granular transcript segments.

---

## 5. Summary of Identified Technical Debt & Conflicts

1. **Audio Recording Library Conflict**:
   - `useSpeechRecorder.ts` only hooks into `Voice` events and does not write `.m4a`/`.wav` files to disk.
   - **Resolution**: Introduce audio recording capability in React Native so audio files are created and uploaded to the FastAPI backend.

2. **Wink-NLP Environment Boundary**:
   - `wink-nlp` is currently used inside React Native (Node/JS environment).
   - In the Python backend, we must use native Python NLP routines (tokenization, regex, frequency analysis, NLTK/custom deterministic algorithms) and NEVER import `wink-nlp` into Python.

3. **Synchronous vs Asynchronous AI Flow**:
   - The current app calls synchronous REST endpoints.
   - The new target architecture requires an asynchronous job pipeline (`uploaded` -> `queued` -> `transcribing` -> `analyzing` -> `coaching` -> `completed`). The mobile UI needs staged progress indicators instead of an infinite spinner.

4. **Multi-Database / Service Coordination**:
   - NestJS manages auth, users, gamification, and general app APIs.
   - FastAPI handles audio upload, Whisper transcription, audio analysis, Ollama coaching, and confidence computation.
   - Shared authentication: FastAPI can validate the exact same JWT signed by NestJS (`JWT_SECRET`) to securely authenticate requests.
