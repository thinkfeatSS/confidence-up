# MIGRATION PLAN: Confidence Intelligence Architecture

**Project**: Confidence Builder / ConfidenceUp  
**Document Version**: 1.0.0  
**Target Backend**: FastAPI + Redis Queue + AI Worker (Whisper + Audio Analytics + Python NLP + Ollama + Confidence Engine) + PostgreSQL / MySQL  
**Target Mobile Flow**: React Native Audio Recording -> FastAPI Asynchronous Job Processing -> Stage Progress UI -> Results & Gamification

---

## 1. Target Architecture & System Topology

```
┌─────────────────────────────────────────────────────────────┐
│                   React Native App (app/)                   │
│  - Records audio file (.m4a / .wav / .aac)                  │
│  - Uploads audio via multipart/form-data to FastAPI         │
│  - Displays multi-stage progress (Uploading, Transcribing,  │
│    Analyzing, Coaching, Calculating Confidence)             │
│  - Renders Confidence Dashboard, Retry Comparison, Missions │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / Bearer JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Nginx Reverse Proxy                      │
│      - Routes /api/v1/speech/* -> FastAPI                   │
│      - Routes other /api/v1/* -> NestJS API                 │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
               ▼                               ▼
┌──────────────────────────────┐ ┌────────────────────────────┐
│      FastAPI AI Service      │ │      NestJS App API        │
│   (/ai-sevices)              │ │   (/api)                   │
│  - JWT Bearer Authentication │ │  - User auth & profiles    │
│  - File validation & upload  │ │  - Gamification & XP       │
│  - Job queueing to Redis     │ │  - Daily missions & badges │
│  - Status & Results retrieval│ │  - Admin Next.js web API   │
└──────────────┬───────────────┘ └─────────────┬──────────────┘
               │ Enqueue                       │
               ▼                               │
┌──────────────────────────────┐               │
│         Redis Queue          │               │
└──────────────┬───────────────┘               │
               │ Dequeue                       │
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                    AI Background Worker                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 1. SPEECH ENGINE                                      │  │
│  │    - FFmpeg audio normalization (16kHz mono WAV)      │  │
│  │    - faster-whisper STT with word & segment timings   │  │
│  │    - Audio duration & speech timestamps               │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 2. ANALYTICS ENGINE (Deterministic Python)            │  │
│  │    - Audio: Volume, stability, pause intervals,       │  │
│  │      pause breakdown (natural/thinking/lost), energy  │  │
│  │    - NLP: WPM, vocabulary richness, repetition score, │  │
│  │      repeated phrases, hedging words, transition count│  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 3. HYBRID MULTILINGUAL ENGINE                         │  │
│  │    - Script detection, stopwords, custom dictionaries │  │
│  │    - Roman Urdu & code-switching distribution         │  │
│  │    - LLM fallback for low-confidence classification   │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 4. AI COACHING ENGINE (Ollama / Fallback Gemini)      │  │
│  │    - Structured JSON: Topic relevance, coverage,      │  │
│  │      strengths, weaknesses, coach tips, next mission  │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ 5. CONFIDENCE ENGINE (Deterministic v1.0)             │  │
│  │    - Fluency (30%) + Topic (30%) + Vocabulary (20%)   │  │
│  │      + Practice Consistency (20%) -> Score (0-100)    │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Save Completed Session
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL / MySQL                       │
│  - users, practice_sessions, audio_files, transcripts,      │
│    transcript_segments, speech_metrics, confidence_scores...│
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Engine Specifications

### 2.1 Speech Engine (`faster-whisper` + FFmpeg)
- **Audio Preprocessing**: Converts input `.m4a`, `.aac`, `.mp3`, or `.wav` using FFmpeg to 16kHz 16-bit mono PCM.
- **Model**: `faster-whisper` (default model `small` or `base` for CPU VPS; configurable to `medium`/`large-v3` on GPU).
- **Outputs**:
  - `transcript`: Clean stitched full transcript text.
  - `segments`: Array of `{ startMs, endMs, text, confidence, words: [...] }`.
  - `speechDurationMs`: Total active vocalized duration.
  - `languageHint`: Whisper detected language code.

### 2.2 Analytics Engine (Deterministic Python)
- **Server-Side Python NLP (replacing client `wink-nlp`)**:
  - Tokenizer: Regex-based Unicode-aware multi-script tokenizer (Latin, Arabic/Urdu, Devanagari).
  - Metrics: Word count, sentence count, speaking length, WPM (`wordCount / (activeSpeakingSeconds / 60)`).
  - Vocabulary richness: Type-token ratio + unique word count.
  - Repetition score: Frequency penalty on repeated n-grams / phrases.
  - Filler words detection: Multi-language dictionaries (`English`, `Urdu`, `Hindi`, `Sindhi`, `Roman Urdu`).
  - Mindset & Structure: Transition words count, hedging words count, sentiment polarity indicators.
- **Audio Metrics**:
  - Volume RMS metering & volume stability score (variance calculation).
  - Pause analysis: Natural pauses (0.3s - 1.0s), Thinking pauses (1.0s - 3.0s), Lost pauses (> 3.0s), pause frequency (`pauses / minute`), pause ratio.
  - Vocal energy & rhythm stability.

### 2.3 Hybrid Multilingual Engine
- **Layer 1 (Deterministic Fast Path)**:
  - Unicode script breakdown: Latin, Arabic/Urdu (`\u0600-\u06FF`), Devanagari (`\u0900-\u097F`).
  - Stopword and filler density scoring per language.
  - Roman Urdu lexicon pattern matching.
  - Code-switching detection and percentage distribution (e.g. `Urdu 64%, English 36%`, `mode: "mixed"`).
- **Layer 2 (User Context)**:
  - Evaluates user's historical `preferredLanguages` without overriding high-confidence transcript evidence.
- **Layer 3 (LLM Fallback)**:
  - If local confidence < 70%, dispatches transcript snippet to Ollama/Gemini with strict JSON fallback schema.

### 2.4 AI Coaching Engine (Ollama + Structured Schema)
- **Model**: Local Ollama model (e.g., `llama3.2:3b`, `qwen2.5:3b`, or `mistral:7b`).
- **Input**: Structured JSON with transcript, topic, WPM, filler count, vocabulary score, pause breakdown.
- **Output Validation**: Validated via Pydantic model (`topicRelevance`, `topicCoverage`, `strengths`, `weaknesses`, `coachingFeedback`, `personalizedSuggestions`, `nextMission`).
- **Provider Abstraction**: Pluggable `AIProvider` base class with `OllamaProvider` (default) and `GeminiProvider` (fallback).

### 2.5 Deterministic Confidence Engine (v1.0)
- **Formula**:
  $$\text{Confidence Score} = (\text{Fluency} \times 0.30) + (\text{Topic Relevance} \times 0.30) + (\text{Vocabulary} \times 0.20) + (\text{Consistency} \times 0.20)$$
- **Clamping**: Clamped to integer range $0 - 100$.
- **Version Tracking**: Tagged with `confidence_engine_version: "1.0"` to ensure historical session score immutability.

---

## 3. Database & Relational Schema Design

To ensure zero loss of historical data while enabling granular analysis, we model:
- `practice_sessions`: Main session record.
- `audio_files`: Storage path, duration, sample rate, format, size, retention expiry.
- `transcripts`: Full raw transcript text, cleaned text, primary language, code-switch mode.
- `transcript_segments`: Granular timestamped segments (`start_ms`, `end_ms`, `text`, `words`, `confidence`).
- `speech_metrics`: Audio metrics (volume, stability, pauses, WPM, rhythm) and NLP metrics (fillers, repetition, vocabulary).
- `confidence_scores`: Version, final score, fluency score, topic score, vocabulary score, consistency score.
- `ai_feedback`: Strengths, weaknesses, coaching feedback, personalized suggestions, next mission.

---

## 4. API Endpoints Specification (`FastAPI` - `/api/v1/`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/speech/upload` | Uploads audio file + metadata (multipart/form-data), returns `{ sessionId, jobId, status: "queued" }` |
| `GET` | `/api/v1/sessions/{session_id}` | Returns current job status (`queued`, `transcribing`, `analyzing`, `coaching`, `completed`, `failed`) and full analysis payload if completed |
| `GET` | `/api/v1/sessions/{session_id}/retry-comparison` | Compares current session with previous attempt on the same prompt/topic |
| `GET` | `/api/v1/progress/timeline` | Returns daily, weekly, monthly, and all-time confidence & fluency trends |
| `GET` | `/api/v1/health` | Healthcheck (verifies Redis, DB, Ollama, Whisper readiness) |
| `POST` | `/api/v1/benchmark` | Runs benchmarking test on sample audio files (30s, 60s, 120s) reporting RAM/CPU/latency |

---

## 5. File-by-File Change Plan

| File / Component | Current Behavior | Required Change | Reason & Dependencies | Risk |
|---|---|---|---|---|
| `ai-sevices/` | Empty folder with `.venv` | Build full FastAPI application (controllers, worker, Whisper, analytics, Ollama, Confidence engine, DB models) | Core backend speech processing infrastructure | Low |
| `app/src/modules/speech/hooks/useSpeechRecorder.ts` | Records using `@dev-amirzubair/react-native-voice` without saving audio files | Update/wrap recorder to record actual audio file (`.m4a`/`.wav`) and track recording time | Required to send audio file to backend for Whisper STT | Medium |
| `app/src/screens/main/SpeakingPracticeScreen.tsx` | Runs client-side `wink-nlp` pipeline and posts final JSON to NestJS | Change flow to upload audio to FastAPI, show stage-by-stage progress, poll status, render results, and display retry comparison | Moves compute off client and elevates STT accuracy | Medium |
| `app/src/modules/speech/services/speechAnalysisPipeline.ts` | Runs client-side analytics | Adapt client pipeline to interface with FastAPI asynchronous session API, maintaining offline fallback if server is unreachable | Preserves offline practice capability | Low |
| `docker-compose.yml` | None | Create complete multi-service docker-compose setup (nginx, fastapi, worker, redis, mysql, ollama) | Production and VPS deployment standard | Low |
| `api/` (NestJS) | Handles `/speech/sessions` | Keep existing endpoints intact for backward compatibility; add sync integration if needed | Prevents breaking existing web/mobile features | Low |

---

## 6. Security, VPS Deployment & Rollback Strategy

1. **Security**:
   - Audio files validated for size (< 25MB) and MIME signature.
   - User authentication verified via shared `JWT_SECRET` bearer tokens.
   - Redis, DB, and Ollama isolated within internal Docker network (no public ports).
2. **VPS Resource Budget (4 vCPU / 16 GB RAM)**:
   - Whisper: `faster-whisper` `small` model (~1GB RAM, fast CPU inference with CTranslate2 INT8 quantization).
   - Ollama: `llama3.2:3b` or `qwen2.5:3b` (~2.5GB RAM).
   - Worker concurrency tuned to 2-3 workers to avoid CPU saturation.
3. **Rollback Strategy**:
   - Existing NestJS endpoints (`POST /speech/sessions`) remain functional.
   - Client can toggle between native backend upload and legacy client pipeline via feature flag.
