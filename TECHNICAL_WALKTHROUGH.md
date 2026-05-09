# MockMate — Complete Technical Walkthrough
## Everything You Need to Explain Every Feature

---

## 1. HIGH-LEVEL ARCHITECTURE

MockMate is a **3-tier microservice application**:

```
┌─────────────┐       ┌──────────────┐       ┌────────────────┐
│  FRONTEND   │ ───►  │   BACKEND    │ ───►  │  ML SERVICE    │
│  React/TS   │       │  Node/Express│       │  Python/FastAPI │
│  Port 5173  │       │  Port 5000   │       │  Port 8000     │
└─────────────┘       └──────┬───────┘       └────────────────┘
                             │
                      ┌──────▼───────┐
                      │  MongoDB     │
                      │  Atlas       │
                      └──────────────┘
```

**Data Flow (every feature follows this):**
1. User interacts with a React page
2. React calls `api.ts` → sends HTTP request to Node.js backend (`/api/...`)
3. Backend authenticates via JWT, loads user's AI settings from MongoDB
4. Backend proxies the request to FastAPI ML service (`http://ml_service:8000/...`)
5. ML service runs rule-based analysis + calls AI (Gemini/Ollama) for enrichment
6. Response flows back: ML → Backend → Frontend → UI render

---

## 2. FRONTEND (React + TypeScript + Vite)

### 2.1 Tech Stack
- **React 18** with functional components and hooks
- **TypeScript** for type safety
- **Vite** as the build tool (fast HMR, ES module bundling)
- **Redux Toolkit** for global state (auth, user data)
- **React Router v6** for client-side routing
- **Axios** for HTTP requests (with interceptors for JWT)
- **Lucide React** for icons
- **React Hot Toast** for notifications

### 2.2 Entry Point (`main.tsx` → `App.tsx`)
- `main.tsx` renders `<App />` into the DOM
- `App.tsx` wraps everything in a Redux `<Provider>` and `<BrowserRouter>`
- On mount, if a JWT token exists in localStorage, it dispatches `getMe()` to rehydrate the user session

### 2.3 Authentication Flow
- `ProtectedRoute` component checks Redux state: `isAuthenticated`
- If not authenticated → redirects to `/login`
- If loading → shows a spinner
- JWT token is stored in `localStorage` and attached to every request via Axios interceptor

### 2.4 API Layer (`lib/api.ts`)
- Creates an Axios instance with `baseURL` from env (`VITE_API_URL`)
- **Request interceptor**: Attaches `Authorization: Bearer <token>` header
- **Response interceptor**: Unwraps `res.data`, handles 401 by clearing token and redirecting
- Exports domain-specific API objects: `authAPI`, `interviewAPI`, `resumeAPI`, `analyticsAPI`, `learningPathAPI`, `projectAPI`

### 2.5 Pages
| Page | Route | Purpose |
|------|-------|---------|
| `LandingPage` | `/` | Marketing page with features overview |
| `AuthPage` | `/login`, `/register` | Login/Register forms |
| `DashboardPage` | `/dashboard` | Stats, streaks, recent sessions |
| `InterviewPage` | `/interview/new` | Full interview simulation |
| `ResumePage` | `/resume` | Resume upload + ATS analysis |
| `LearningPathPage` | `/learning-path` | AI-generated study roadmap |
| `ProjectCritiquePage` | `/project-critique` | Architectural audit |
| `SettingsPage` | `/settings` | Profile + AI provider config |

### 2.6 Design System
- **Glassmorphism**: Cards use `backdrop-filter: blur()` with semi-transparent backgrounds
- **CSS Variables**: All colors defined in `:root` (e.g., `--primary`, `--accent-primary`, `--bg-card`)
- **Dark mode** by default
- **Google Font**: Inter for modern typography

---

## 3. BACKEND (Node.js + Express)

### 3.1 Tech Stack
- **Express.js** — HTTP server
- **Mongoose** — MongoDB ODM
- **Socket.io** — Real-time WebSocket events (for live interview sessions)
- **JWT (jsonwebtoken)** — Stateless authentication
- **bcryptjs** — Password hashing (12 salt rounds)
- **Helmet** — Security headers
- **express-rate-limit** — 200 requests per 15 min per IP
- **multer** — File upload handling (resume PDFs)
- **compression** — gzip response compression

### 3.2 Database Models (MongoDB/Mongoose)

#### User Model (`models/User.js`)
```
User {
  name, email, password (hashed),
  profile: { targetRole, experience, skills[], resumeText },
  stats: { totalSessions, totalQuestions, averageScore, streak },
  aiSettings: { provider, ollamaHost, ollamaModel, geminiApiKey },
  knowledgeGraph: { strongTopics[], weakTopics[], masteredTopics[] },
  subscription: { plan: 'free'|'pro'|'enterprise' }
}
```
- Password is auto-hashed via a Mongoose `pre('save')` hook
- `toJSON()` method strips the password field from API responses

#### InterviewSession Model (`models/InterviewSession.js`)
```
InterviewSession {
  userId (ref → User), sessionId (UUID),
  type: 'technical'|'behavioral'|'coding'|'system-design',
  difficulty, mode: 'classic'|'ai',
  questions: [{
    questionText, userAnswer,
    scores: { semantic, factual, completeness, clarity, overall },
    feedback, timeTaken
  }],
  analytics: { totalScore, averageScore, duration, strongAreas[], weakAreas[] },
  behavioralMetrics: { confidenceScore, speechPace, fillerWordCount }
}
```

### 3.3 Authentication Middleware (`middleware/auth.js`)
- Extracts JWT from `Authorization: Bearer <token>` header
- Verifies with `JWT_SECRET` env variable
- Loads full User document (minus password) into `req.user`
- All `/api/*` routes (except auth) use `protect` middleware

### 3.4 Backend Routes (Proxy Layer)

The backend acts as an **authenticated proxy** between the frontend and the ML service:
1. Validates the user is authenticated
2. Extracts the user's `aiSettings` from MongoDB (their API key, provider preference)
3. Forwards the request to the FastAPI ML service with those settings injected
4. Returns the ML response to the frontend

| Backend Route | ML Service Endpoint | Purpose |
|---------------|---------------------|---------|
| `POST /api/interview/question` | `POST /generate-question` | Get next interview question |
| `POST /api/interview/evaluate` | `POST /evaluate-answer` | Score an answer |
| `POST /api/resume/upload` | `POST /upload-resume` | Parse PDF to text |
| `POST /api/resume/analyze` | `POST /analyze-resume` | Full resume analysis |
| `POST /api/resume/cover-letter` | `POST /generate-cover-letter` | AI cover letter |
| `POST /api/learning-path/generate` | `POST /generate-learning-path` | Study roadmap |
| `POST /api/project/critique` | `POST /critique-project` | Architectural audit |

### 3.5 Socket.io (Real-Time)
- Used for live interview sessions
- Events: `join-session`, `answer-submitted`, `typing`, `request-hint`, `disconnect`
- Tracks active sessions in a `Map<socketId, {sessionId, userId}>`

---

## 4. ML SERVICE (Python + FastAPI) — The AI Brain

### 4.1 Tech Stack
- **FastAPI** — Async Python web framework (auto-generates OpenAPI docs at `/docs`)
- **Pydantic** — Request/response validation
- **httpx** — Async HTTP client (for calling Ollama/Gemini APIs)
- **PyMuPDF (fitz)** — PDF text extraction
- **sentence-transformers** — Semantic similarity (optional, with TF-IDF fallback)
- **Gunicorn + Uvicorn** — Production ASGI server

### 4.2 AI Provider System (`ai_provider.py`) — CORE ENGINE

This is the most important file. It abstracts ALL AI interactions behind a unified interface.

#### Provider Architecture (BYOK — Bring Your Own Key)
```
User Settings (MongoDB)
    ↓
Backend injects aiSettings into ML request
    ↓
ai_provider.py reads: provider, host, model, apiKey
    ↓
Routes to either:
  ├── Google Gemini (cloud, via REST API)
  └── Local Ollama (self-hosted LLM)
```

#### Key Functions:
| Function | What It Does |
|----------|-------------|
| `_active_provider(key)` | Determines which AI to use (gemini/ollama/none) |
| `_call_ollama(prompt)` | Sends prompt to local Ollama `/api/generate` endpoint |
| `_call_gemini(prompt)` | Sends prompt to Google `generativelanguage.googleapis.com` |
| `complete(prompt)` | Unified interface — calls the active provider |
| `_extract_json(text)` | Parses JSON from AI response (handles markdown fences) |

#### How `_call_gemini` works:
1. Constructs URL: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}`
2. Sends POST with `{"contents": [{"parts": [{"text": prompt}]}]}`
3. Extracts text from `response.candidates[0].content.parts[0].text`
4. Returns raw text string

#### How `_call_ollama` works:
1. Sends POST to `{host}/api/generate` with `{"model": model, "prompt": prompt, "stream": false}`
2. Extracts text from `response.response`
3. Returns raw text string

#### JSON Extraction Pipeline:
AI responses often contain markdown. `_extract_json()` handles this:
1. Try direct `json.loads(text)`
2. Try extracting from markdown fences: ```json ... ```
3. Try finding first `{...}` or `[...]` pattern
4. If all fail → return None (caller uses fallback logic)

---

## 5. FEATURE-BY-FEATURE DEEP DIVE

### 5.1 INTERVIEW SIMULATION

**Files:** `InterviewPage.tsx` → `routes/interview.js` → `routers/questions.py` + `routers/evaluation.py`

**Flow:**

1. **Start Session**: User picks type, difficulty, company
   - Backend creates an `InterviewSession` in MongoDB with a UUID

2. **Generate Question**:
   - ML service tries AI first (sends a detailed prompt to Gemini/Ollama)
   - Prompt includes: question type, difficulty, category, company style, resume context, previously asked questions
   - Includes a random "twist" directive for variety (e.g., "Focus on distributed systems trade-offs")
   - If AI fails → falls back to 100+ question static `QUESTION_BANK`

3. **Evaluate Answer** — Multi-dimensional scoring:
   - **Semantic Similarity**: sentence-transformers (MiniLM-L6-v2) cosine similarity. Falls back to TF-IDF.
   - **Keyword Coverage**: Regex whole-word matching against expected keywords
   - **Factual Score**: keyword_coverage × 0.7 + semantic × 0.3
   - **Completeness Score**: (keyword × 0.6 + semantic × 0.4) × length_penalty
   - **Clarity Score**: Sentence length analysis + structural markers
   - **Overall**: semantic×0.35 + factual×0.35 + completeness×0.20 + clarity×0.10
   - AI can adjust the overall score by up to 30%

4. **Complete Session**: Calculates final analytics, updates user lifetime stats

### 5.2 RESUME ANALYSIS

**Files:** `ResumePage.tsx` → `routes/resume.js` → `routers/resume_analysis.py`

**Flow:**

1. **Upload**: PDF → PyMuPDF extracts text → saved to user profile in MongoDB

2. **ATS Scoring** (5 categories, max 100):
   - Sections presence (25 pts): Experience, Education, Skills, Projects, Summary, Certs, Contact
   - Action verbs (20 pts): 28 verbs like "architected", "deployed", "optimized"
   - Quantified achievements (20 pts): Regex for %, $, user counts
   - Technical skills density (20 pts): 80+ skill dictionary with weights
   - Format signals (15 pts): Email, phone, LinkedIn, GitHub, word count

3. **JD Match**: Weighted skill overlap (60%) + keyword overlap (40%)

4. **AI Enhancement**: AI acts as a "Distinguished Senior Technical Recruiter" and can override scores + add specific suggestions

5. **Cover Letter Generation**: AI writes a tailored cover letter from resume + JD

### 5.3 LEARNING PATH

**Files:** `LearningPathPage.tsx` → `routes/learning-path.js` → `routers/learning_path.py`

**Flow:**

1. User inputs: target role, current skills, experience level, weak topics, hours/week
2. Rule-based: Looks up role requirements (8 roles defined), calculates skill gap, generates 3 study phases
3. AI enrichment: Generates custom phases, weekly breakdown, project ideas, milestones, "interviewer perspective" questions
4. Uses random "strategic angles" each time for unique roadmaps

### 5.4 PROJECT ARCHITECT CRITIQUE

**Files:** `ProjectCritiquePage.tsx` → `routes/project.js` → `routers/project_critique.py`

**Flow:**

1. User inputs: project description + tech stack
2. AI acts as "Staff Systems Architect" — generates: architecture score, strengths, vulnerabilities, killer questions, staff-level alternative
3. Heuristic fallback: Analyzes tech stack keywords for common patterns (React → "Component-based architecture", Redis → "High-performance caching")

---

## 6. AI SECURITY (BYOK Model)

**Problem**: Don't want to hardcode API keys or pay for all users' AI usage.
**Solution**: Each user brings their own Gemini API key.

**Flow:**
1. User enters Gemini API key in Settings page
2. Saved to `user.aiSettings.geminiApiKey` in MongoDB
3. Backend reads `req.user.aiSettings` and injects it into ML request
4. ML service uses the injected key for Gemini API calls
5. Key never touches server environment variables — it's per-user, per-request

---

## 7. DEPLOYMENT

### Render.yaml (3 services):
| Service | Type | Runtime | Start Command |
|---------|------|---------|---------------|
| `mockmate-ml` | web | Python | `gunicorn main:app -w 2 -k uvicorn.workers.UvicornWorker` |
| `mockmate-backend` | web | Node | `npm start` |
| `mockmate-frontend` | static | Static | Serves `./dist` with SPA rewrite `/* → /index.html` |

### Docker Compose (local dev): MongoDB + ML + Backend + Frontend on `mockmate-net` bridge network

---

## 8. KEY CONCEPTS FOR INTERVIEWS

1. **Microservice Architecture**: 3 independent services communicating via REST
2. **BYOK Security**: User credentials never in server env; per-request injection
3. **Hybrid AI/Rule-Based**: AI enriches rule-based scoring, never replaces it
4. **Semantic Similarity**: sentence-transformers (MiniLM-L6-v2) for cosine similarity
5. **TF-IDF Fallback**: Term-frequency inverse document frequency when ML libraries unavailable
6. **Multi-Dimensional Scoring**: 5-axis evaluation (semantic, factual, completeness, clarity, overall)
7. **Adaptive Question Generation**: AI + randomization + resume context + company targeting
8. **PDF Parsing**: PyMuPDF extracts text from uploaded PDFs server-side
9. **JWT Auth**: Stateless auth with bcrypt password hashing (12 rounds)
10. **WebSocket Events**: Socket.io for live interview session management
11. **Graceful Degradation**: Every AI feature has a complete rule-based fallback
12. **Prompt Engineering**: Structured prompts with role-playing, JSON schema, randomization

---

## 9. ENVIRONMENT VARIABLES

### Backend: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `ML_SERVICE_URL`, `FRONTEND_URL`, `NODE_ENV`
### ML Service: `AI_PROVIDER` (ollama|gemini|none), `GEMINI_MODEL`, `OLLAMA_HOST`, `OLLAMA_MODEL`
### Frontend: `VITE_API_URL`

---

## 10. YOUR 30-SECOND INTERVIEW PITCH

> "MockMate is a full-stack AI interview preparation platform I built using React, Node.js, and Python FastAPI in a microservice architecture. It uses Google Gemini for real-time interview simulation, multi-dimensional answer evaluation using NLP techniques like TF-IDF cosine similarity and transformer embeddings, and features like resume ATS scoring, architectural project audits, and personalized learning paths. The system uses a Bring-Your-Own-Key model for AI authentication and gracefully degrades to rule-based analysis when AI is unavailable."

**Key lines to highlight:**
- "I built a hybrid scoring engine that combines rule-based NLP with LLM enrichment"
- "The BYOK model means zero API cost for the platform operator"
- "Every AI feature has a complete fallback — the app never breaks if the AI is down"
- "I used prompt engineering with randomization layers to ensure question variety"
