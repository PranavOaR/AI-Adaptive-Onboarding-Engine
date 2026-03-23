# AI-Adaptive Onboarding Engine

A full-stack web application that ingests a candidate's resume and a job description, performs intelligent skill-gap analysis, generates a personalized learning roadmap, and offers interactive DSA coding challenges — all behind a secure authentication layer.

Built with a **Mission Control** dark aesthetic featuring monospace typography, cyan/amber/green accent colors, and GSAP scroll animations.

---
 
## Architecture 

```
Browser (port 5173)
  └─ Vite dev proxy:
      /auth      → Auth Server   (port 3001)  [Express + SQLite + JWT]
      /analyze   → Backend API   (port 8000)  [FastAPI, JWT-protected]
      /judge0    → ce.judge0.com              [Free code execution]
```

Three servers, three ports. No external database — SQLite auto-creates on first run.

---

## Features

### 1. Resume & JD Analysis Pipeline
- Upload resume (PDF, DOCX, TXT) + job description (file or paste)
- **Skill extraction** — regex + alias mapping against a 50+ skill taxonomy
- **Proficiency estimation** — 4-level scale (1 = beginner → 4 = expert) based on keyword depth and context signals
- **Gap analysis** — compares candidate vs required profile with priority scoring (JD importance × gap magnitude)
- **Role detection** — auto-detects role from JD against 9 supported intern profiles via cluster scoring

### 2. Personalized Learning Roadmap
- Topologically-sorted course recommendations across Foundation → Intermediate → Role-Specific phases
- Prerequisite chain resolution with cycle detection
- Duration estimates and difficulty badges (beginner / intermediate / advanced)
- Reasoning traces explaining *why* each course was selected (JD evidence, resume evidence, ordering rationale)

### 3. DSA Challenge Arena
- In-browser coding environment powered by **Monaco Editor** (VS Code's editor)
- Terminal output via **Xterm.js** with Mission Control color theme
- Code execution through **Judge0 CE** (free public API) — supports Python, JavaScript, Java
- **12 curated challenges** mapped to 8 skill domains (Coding DSA, Framework Debugging, Configs, Scenario Analysis, MCQ)
- Automatic verdict: ACCEPTED / WRONG ANSWER / ERROR with expected vs actual comparison

### 4. Authentication
- Express.js auth server with **better-sqlite3** for user storage
- JWT (HS256, 7-day expiry) issued on login/signup
- Shared `JWT_SECRET` validated by FastAPI backend via `python-jose`
- Session persistence via localStorage token + axios interceptor

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, Tailwind CSS, GSAP + ScrollTrigger, Anime.js, Axios |
| **Code Editor** | Monaco Editor (`@monaco-editor/react`) |
| **Terminal** | Xterm.js (`@xterm/xterm` + `@xterm/addon-fit`) |
| **Backend API** | FastAPI (Python), Pydantic v2, PyMuPDF, python-docx, python-jose |
| **Auth Server** | Express.js, better-sqlite3, jsonwebtoken |
| **Code Execution** | Judge0 CE (free public API) |

---

## Project Structure

```
project/
├── auth-server/            # Express auth server (port 3001)
│   ├── index.js            # Signup, login, logout, session endpoints
│   ├── package.json
│   └── .env.example
│
├── backend/                # FastAPI analysis engine (port 8000)
│   ├── main.py             # /analyze endpoint
│   ├── models.py           # Pydantic response schemas
│   ├── start.js            # Node wrapper for uvicorn
│   ├── middleware/
│   │   └── auth.py         # JWT verification dependency
│   ├── services/
│   │   ├── parser_service.py       # PDF/DOCX/TXT extraction
│   │   ├── skill_extractor.py      # Taxonomy-based skill detection
│   │   ├── proficiency_estimator.py # 4-level proficiency scoring
│   │   ├── gap_analyzer.py         # Gap computation + priority ranking
│   │   ├── roadmap_generator.py    # Topo-sorted course recommendations
│   │   └── reasoning_service.py    # Human-readable reasoning traces
│   └── data/
│       ├── taxonomy.json           # 50+ skills with aliases
│       ├── courses.json            # Course catalog
│       └── role_templates.json     # Role → required skills mapping
│
└── frontend/               # React SPA (port 5173)
    ├── vite.config.js       # Dev proxy for 3 backends
    ├── tailwind.config.js   # Mission Control theme
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── styles/global.css
        ├── api/
        │   ├── analyzeApi.js      # Multipart upload to /analyze
        │   └── authClient.js      # JWT token management
        ├── hooks/
        │   ├── useAuth.jsx        # Auth context + provider
        │   └── useScrollAnimation.js
        ├── components/
        │   ├── AuthGuard.jsx      # Login/Signup gate
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   ├── HeroUpload.jsx     # Resume + JD upload
        │   ├── AnalysisProgress.jsx
        │   ├── SummaryBanner.jsx   # Readiness score + gap tags
        │   ├── CandidateProfile.jsx
        │   ├── RequiredProfile.jsx
        │   ├── GapMatrix.jsx
        │   ├── RoadmapTimeline.jsx # Course cards + challenge buttons
        │   ├── ChallengeArena.jsx  # Monaco + Xterm + Judge0
        │   └── ReasoningPanel.jsx
        └── data/
            └── challenges.json     # 8 DSA problems
```

---

## Getting Started

### Prerequisites
- **Node.js** >= 18
- **Python** >= 3.9
- **npm** or **yarn**

### 1. Clone the repository

```bash
git clone https://github.com/PranavOaR/AI-Adaptive-Onboarding-Engine.git
cd AI-Adaptive-Onboarding-Engine
```

### 2. Set up the Auth Server

```bash
cd auth-server
cp .env.example .env        # Edit secrets if needed
npm install
npm start                   # Runs on http://localhost:3001
```

### 3. Set up the Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate
pip install -r requirements.txt
node start.js               # Runs on http://localhost:8000
```

### 4. Set up the Frontend

```bash
cd frontend
npm install
npm run dev                 # Runs on http://localhost:5173
```

### 5. Open the app

Navigate to **http://localhost:5173** — you'll see the login screen. Sign up, upload a resume and job description, and explore your personalized analysis.

---

## Environment Variables

Create `.env` files from the provided `.env.example`:

| Variable | Default | Purpose |
|----------|---------|---------|
| `JWT_SECRET` | `mc_jwt_secret_mission_control_2026` | Shared secret for JWT signing/verification |
| `AUTH_SECRET` | `mc_auth_secret_mission_control_2026` | Salt for password hashing |

> **Note:** Both auth-server and backend must share the same `JWT_SECRET` for token validation to work.

---

## Screenshots

### Login Screen
Mission Control styled full-screen authentication with monospace typography and grid background.

### Analysis Dashboard
Readiness score ring, matched/partial/missing skill counts, gap tags, candidate vs required profiles, and gap matrix.

### Learning Roadmap
Phase-grouped course cards (Foundation → Intermediate → Role-Specific) with difficulty badges, duration estimates, and "Challenge Your Skills" buttons.

### Challenge Arena
Three-panel coding environment: problem sidebar, Monaco Editor with language selector, and Xterm.js terminal with color-coded execution output and verdict.

---

## How It Works

```
Resume + JD
    │
    ▼
┌─────────────────┐
│  Parse Documents │  PyMuPDF / python-docx / plaintext
└────────┬────────┘
         ▼
┌─────────────────┐
│  Extract Skills  │  taxonomy.json aliases → regex matching
└────────┬────────┘
         ▼
┌─────────────────┐
│ Estimate Levels  │  keyword depth × context signals → 1-4 scale
└────────┬────────┘
         ▼
┌─────────────────┐
│  Gap Analysis    │  candidate level vs required level → priority score
└────────┬────────┘
         ▼
┌─────────────────┐
│ Generate Roadmap │  topo-sort courses → phase assignment → prerequisites
└────────┬────────┘
         ▼
┌─────────────────┐
│ Reasoning Traces │  JD evidence + resume evidence + ordering rationale
└─────────────────┘
```

---

## License

This project is open source and available under the [MIT License](LICENSE).
