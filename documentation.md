# Exam Analyser — Project Documentation

## 1. Project overview

**Exam Analyser** is a full-stack web application that reads examination response-sheet PDFs, extracts candidate answers, calculates marks, stores results, and presents an interactive report. It currently has production-oriented flows for **NIMCET**, **CUET (PG)**, **RRB Group D / Technician**, and **SSC MTS**; the UI also lists several future exams as “Coming Soon”.

The project is a modular monorepo:

| Area | Directory | Main technology | Purpose |
| --- | --- | --- | --- |
| Client | `frontend/` | React 19, Vite, Axios, Recharts | Upload, result visualisation, report actions, admin UI |
| API | `backend/` | Node.js, Express 5, Mongoose | Upload API, scoring, persistence, jobs, reports, admin APIs |
| Parser | `parser/` | Python, Flask, PyMuPDF | PDF text/layout extraction and exam-specific parsing |
| Shared data | `shared/` | JSON | NIMCET answer-key data |
| Deployment | root Docker files | Docker, Nginx, Redis | Containerisation and web-server configuration |

## 2. Main features

- PDF response-sheet upload with drag-and-drop support.
- CUET upload accepts both a response-sheet PDF and an official answer-key PDF.
- Automatic answer extraction and candidate-detail extraction.
- Exam-specific score calculation, including NIMCET section breakdowns.
- Synchronous fallback and asynchronous BullMQ/Redis job processing.
- Job progress, queue position, ETA estimate, retry support, and queue dashboard.
- MongoDB result persistence, result sharing, response correction and recalculation.
- Downloadable single-page PDF reports.
- Protected hash-routed administration panel for metrics, saved results, jobs, and service health.
- Redis result cache and parser-service circuit breaker.

## 3. Architecture

```text
Browser (React/Vite)
  │ POST multipart /api/upload
  ▼
Express API (Node.js)
  ├─ synchronous mode ───────────────┐
  └─ asynchronous mode → Redis/BullMQ │
                             │         ▼
                             └── Worker → Flask parser
                                             │
                                  PyMuPDF exam parsers
                                             │
                          scoring + MongoDB persistence
                                             │
                        result/report/admin API responses
```

The frontend calls the Express API. The API either runs a scoring pipeline immediately or saves the upload to a temporary file, queues a job in Redis, and lets a BullMQ worker complete the same pipeline. Each pipeline sends the PDFs to the Flask parser, validates the extraction, scores it, and upserts the result in MongoDB.

## 4. Supported exams and scoring

| Exam / upload value | Parser and answer-key source | Scoring implemented in code |
| --- | --- | --- |
| `nimcet` | NIMCET-specific parser; answers extracted from the response sheet | Q1–50 Mathematics: +12 / −3; Q51–90 Logical Reasoning: +6 / −1.5; Q91–110 Computer Awareness: +6 / −1.5; Q111–120 English: +4 / −1 |
| `cuet` | Response PDF plus user-supplied answer-key PDF | +4 correct, −1 incorrect |
| `rrb`, `rrb-group-d`, `rrb-technician` | RRB layout parser, including colour-based correct-answer detection | +1 correct, −1/3 incorrect |
| `ssc-mts` | Reuses the parser’s RRB-family route | +3 correct, −1 incorrect |

Blank or invalid answers are treated as unattempted. Parsing confidence is returned as a 0–1 value; the UI labels values below 0.5 as low, 0.5–0.69 as medium, and 0.7+ as high.

## 5. Repository structure

```text
marks-analyser/
├── frontend/                  # React client
│   ├── src/api/               # Axios clients and admin-token helpers
│   ├── src/components/        # Reusable visual components
│   ├── src/pages/             # Landing, exam hub, upload and result views
│   └── src/pages/admin/       # Admin dashboard, jobs, health, etc.
├── backend/                   # Express application
│   └── src/
│       ├── config/            # Environment, MongoDB, Redis setup
│       ├── controllers/       # HTTP request handlers
│       ├── jobs/              # BullMQ queue, worker, Bull Board
│       ├── middleware/        # Authentication, cache, error handling
│       ├── models/            # Result Mongoose schema/model factory
│       ├── routes/            # API route definitions
│       ├── services/          # Parser client, validation, scoring pipelines
│       └── utils/             # Logging, temp files, circuit breaker
├── parser/                    # Flask PDF-parser service
│   ├── routes/parse.py        # POST /parse API
│   └── services/              # Extractors and NIMCET/CUET/RRB parsers
├── shared/nimcet_answer_key.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.parser
├── Dockerfile.frontend
└── nginx-frontend.conf
```

The repository also contains scraper scripts, JSON data exports, diagrams, presentation files, and prior project-documentation files. They are auxiliary artefacts rather than components required to run the web application.

## 6. Technology stack

### Frontend

- **React 19** and **React DOM 19** for the single-page user interface.
- **Vite 8** with `@vitejs/plugin-react` for local development and production builds.
- **Axios** for API calls.
- **Recharts** for score and section charts.
- **ESLint** for client-side linting.
- **Tailwind/PostCSS/Autoprefixer** are installed build dependencies; the current UI styling is predominantly project CSS and inline component styles.

### Backend

- **Node.js 20** in the container image.
- **Express 5**, CORS, Helmet, Morgan, and express-rate-limit.
- **Mongoose** / MongoDB for results.
- **Redis** with ioredis; **BullMQ** for background processing.
- **Bull Board** for queue inspection at `/admin/queues` when async mode is enabled.
- **Multer** for in-memory multipart PDF uploads.
- **Axios** and `form-data` for API-to-parser requests.
- **PDFKit** for report generation.

### Parser

- **Python 3.11** in the container image (3.10+ is suitable for local development).
- **Flask** and Flask-CORS to expose the parser API.
- **PyMuPDF (`fitz`)** for PDF text and layout extraction.
- `pytesseract` is listed as a dependency, but no current parser route invokes OCR.
- Root-level scraping/data tooling additionally uses Requests, BeautifulSoup, Pandas, Selenium and lxml.

### Infrastructure

- **Docker Compose** runs frontend, backend, parser, Redis, and an optional standalone worker.
- **Nginx** serves the built frontend and provides SPA fallback plus long-lived static asset caching.
- **MongoDB Atlas** or another MongoDB-compatible deployment is required for persistence.

## 7. Environment configuration

Create `backend/.env` locally. Do not commit credentials or place real secrets in documentation.

```dotenv
BACKEND_PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<database>
PARSER_URL=http://localhost:5001
REDIS_URL=redis://localhost:6379
UPLOAD_MAX_MB=10
ASYNC_UPLOAD=true
WORKER_CONCURRENCY=2
ADMIN_SECRET=<long-random-secret>
LOG_LEVEL=info
# Optional: TEMP_DIR=/tmp
```

| Variable | Default | Meaning |
| --- | --- | --- |
| `BACKEND_PORT` / `PORT` | `5000` | Express listen port |
| `MONGO_URI` | none | MongoDB connection string; required at startup |
| `PARSER_URL` | `http://localhost:5001` | Flask parser base URL |
| `REDIS_URL` | `redis://localhost:6379` | Redis/BullMQ/cache URL; supports `rediss://` |
| `UPLOAD_MAX_MB` | `10` | Maximum upload size enforced by Multer |
| `ASYNC_UPLOAD` | enabled unless explicitly `false` | Enables job queue if Redis is available |
| `WORKER_CONCURRENCY` | `2` in-process / `3` standalone | Maximum concurrent parse jobs |
| `ADMIN_SECRET` | empty | Bearer token that protects `/api/admin/*`; empty denies all admin access |
| `TEMP_DIR` | `/tmp` | Parent location for queue upload files |
| `LOG_LEVEL` | not debug | Set to `debug` to emit debug logs |
| `VITE_API_BASE_URL` | `http://localhost:5000` | Frontend API URL; set in `frontend/.env` for deployed clients |

**Security note:** rotate any credentials that have ever been committed to, pasted in, or exposed from a local `.env` file. Ensure `backend/.env` is ignored by Git and use managed secrets in deployments.

## 8. Local development

Prerequisites: Node.js 18+ (Node 20 matches the Docker images), Python 3.10+, MongoDB access, and Redis for asynchronous jobs.

```bash
# Parser service
cd parser
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

```bash
# Backend API, in another terminal
cd backend
npm install
npm run dev
```

```bash
# Frontend, in another terminal
cd frontend
cp .env.example .env
npm install
npm run dev
```

For Redis locally:

```bash
docker compose up -d redis
```

Default endpoints are frontend `http://localhost:5173`, backend `http://localhost:5000`, parser `http://localhost:5001`, and Redis `localhost:6379`.

Useful checks:

```bash
curl http://localhost:5000/health
curl http://localhost:5001/health
cd frontend && npm run lint
cd frontend && npm run build
```

## 9. Docker deployment

Start the complete stack after creating `backend/.env`:

```bash
docker compose up --build
```

The compose services expose:

| Service | Host port | Responsibility |
| --- | --- | --- |
| `frontend` | `3000` → Nginx `80` | Built React application |
| `backend` | `5000` | API and optional in-process worker |
| `parser` | `5001` | PDF parser API |
| `redis` | `6379` | Job queue and response cache |
| `worker` | none | Optional independently scalable BullMQ worker |

The worker service is defined in Compose. Run it only when appropriate for the deployment model; the API also starts an in-process worker when async uploads and Redis are available. For horizontal worker scaling, the repository notes `docker compose up --scale worker=3`.

## 10. API reference

All backend routes are rooted at `http://<backend-host>`. Error responses normally use `{ success: false, error, message }`.

### Public and user-facing endpoints

| Method and path | Request | Response / behaviour |
| --- | --- | --- |
| `GET /health` | none | `{ ok: true }` backend liveness |
| `GET /health/parser` | none | Backend liveness plus parser circuit-breaker status |
| `POST /api/upload` | multipart: `file` PDF, `exam`; add `answerKeyFile` for CUET | Returns result synchronously, or `202` with `jobId` in async mode |
| `GET /api/job/:jobId` | none | Job status, progress, queue ETA; completed jobs include `result` |
| `GET /api/result/:id` | MongoDB ObjectId | Persisted result, candidate details and responses; cached for 10 minutes when Redis is available |
| `POST /api/recalculate/:id` | JSON: `{ "responses": { "Q1": "A", "Q2": "B" } }` | Replaces the full response map, rescoring the stored answer key |
| `GET /api/report/:id` | MongoDB ObjectId | Downloads a generated A4 PDF report |

`POST /api/upload` accepts: `nimcet`, `cuet`, `rrb`, `rrb-group-d`, `rrb-technician`, and `ssc-mts`. All uploaded files must be PDFs and are limited by `UPLOAD_MAX_MB`.

The async upload response is:

```json
{
  "success": true,
  "mode": "async",
  "jobId": "<bullmq-job-id>",
  "message": "PDF uploaded. Processing in background."
}
```

The frontend polls the job endpoint until it is completed or failed. Jobs default to three attempts with exponential backoff (3, 6, then 12 seconds); completed jobs are retained for up to 30 minutes and failed jobs for up to 24 hours.

### Parser service endpoints

| Method and path | Request | Behaviour |
| --- | --- | --- |
| `GET /health` | none | `{ "ok": true }` |
| `POST /parse` | multipart: `file`, optional `exam`, optional `expected_questions`; requires `answer_key_file` for CUET | Returns `{ responses, answerKey, candidateDetails, confidence }` |

The parser accepts `nimcet`, `cuet`, `rrb`, `rrb-group-d`, `rrb-technician`, and `ssc-mts`. The backend enforces a 60-second parser HTTP timeout; queued work also has a 45-second circuit-breaker request timeout.

### Admin endpoints

Admin endpoints require `Authorization: Bearer <ADMIN_SECRET>` and have a separate limit of 20 requests per 15 minutes per IP.

| Method and path | Purpose |
| --- | --- |
| `GET /api/admin/stats` | Total results, today’s uploads, average marks, per-exam counts, queue counts, uptime |
| `GET /api/admin/results?exam=all&page=1&limit=20` | Paginated saved results; `exam` supports `all`, `nimcet`, `cuet`, `rrb` |
| `GET /api/admin/jobs?status=all&page=1&limit=20` | Queue jobs and progress; needs Redis |
| `POST /api/admin/job/:id/retry` | Retries a failed job |
| `GET /api/admin/health` | MongoDB, Redis, and parser status |
| `GET /admin/queues` | Bull Board queue UI when async mode is enabled |

The React admin application is available through hash routes such as `#/admin/login`, `#/admin/jobs`, and `#/admin/health`. Its token is held in browser `sessionStorage`, not embedded in the frontend build.

## 11. Data model and lifecycle

Each result document has this logical shape:

```json
{
  "exam": "nimcet",
  "name": "Candidate name or Unknown",
  "applicationNo": "string",
  "rollNo": "string",
  "marks": 0,
  "correct": 0,
  "incorrect": 0,
  "unattempted": 0,
  "responses": { "Q1": "A" },
  "answerKey": { "Q1": "B" },
  "createdAt": "date",
  "updatedAt": "date"
}
```

The model factory writes to a collection named `<exam>_results`. Results are upserted by `(applicationNo, rollNo)` when both candidate values are known; otherwise a new document is created. MongoDB creates a compound index for that pair in the NIMCET, CUET, and RRB collections.

When a user corrects responses in the result screen, the API validates keys as `Q<number>` and values as `A`–`D` (or `Unattempted`), replaces the entire responses object, recalculates the score, and clears that result’s Redis cache key.

## 12. Parsing and validation details

- `extract_text.py` uses PyMuPDF text extraction for each page.
- NIMCET verifies that source text contains “NIMCET”, then extracts candidate data and response/key values with its dedicated parser.
- CUET parses long numeric question/option IDs. It attempts keyword-based, answer-key-anchored, and sequential grouping strategies, selecting the strategy with best answer-key coverage.
- RRB parsing reads PyMuPDF spans and uses green-coloured option markers to identify correct answers, then normalises them to `Q1`, `Q2`, etc.
- Response validation rejects malformed labels, unknown question IDs beyond a tolerance, empty extraction, and invalid answer values.
- A warning is attached to a pipeline result below 70% confidence.

Queued uploads are written to `<TEMP_DIR>/exam-uploads` rather than serialised into Redis. The worker removes files on success/failure and also sweeps orphaned files older than 30 minutes every 15 minutes.

## 13. Reliability and security measures

- Helmet security headers, CORS, request logging, Morgan access logs, JSON body size limit, and a global 5,000-requests-per-15-minutes limiter.
- PDF-only Multer filter and configurable file-size limit.
- Admin token verification using a timing-safe comparison; auth fails closed without `ADMIN_SECRET`.
- Redis caching fails open: normal result reads continue if Redis is unavailable.
- At startup, unavailable Redis disables async uploads and selects synchronous processing.
- Parser circuit breaker opens after three consecutive failures, retries after 30 seconds, and fails fast while open.
- Worker concurrency, rate limiting (five jobs per 10 seconds), retries, stalled-job detection, job retention limits, and progress reporting.
- Nginx SPA fallback, gzip, and immutable caching for static build assets.

## 14. Known implementation notes

- NIMCET has a JSON key under `shared/`, but the current NIMCET pipeline relies on the parser-returned answer key. `loadAnswerKey()` exists but is not used by that pipeline.
- `ssc-mts` can be uploaded and scored, but result retrieval/admin result controllers currently search only NIMCET, CUET, and RRB collections. Add `ssc-mts` to those controller exam lists before treating persisted SSC result links, reports, or admin views as complete.
- The frontend’s edit form supplies A–D answers. CUET responses internally use numeric option IDs, so its current manual-recalculation validation is not compatible with CUET’s parser/scoring representation without adjustment.
- Bull Board is mounted without its own auth middleware. Restrict `/admin/queues` at the reverse proxy or protect it in Express before exposing a deployment publicly.
- The Docker parser image does not install the Tesseract system binary; that is acceptable today because OCR is not invoked. Add it only if OCR is introduced.
- Current parser tests are present in `parser/test_*.py`; the Node backend package has no configured test script.

## 15. Extending the project

To add a new exam:

1. Add an active exam card in `frontend/src/pages/HomePage.jsx` and set whether an answer-key PDF is required.
2. Add the identifier to `supportedExams` in `backend/src/controllers/uploadController.js`.
3. Add extraction logic in `parser/services/` and route it in `parser/routes/parse.py`.
4. Add a scoring pipeline under `backend/src/services/pipelines/` and invoke it from both `uploadController.js` and `jobs/parseWorker.js`.
5. Update response validation if answer values do not use A–D.
6. Include the exam consistently in the result model lookups, report/recalculate controller loops, MongoDB index setup, and admin filters/statistics.
7. Add parser and scoring tests using representative PDFs/fixtures, then update this document.

## 16. Troubleshooting

| Symptom | Checks and likely resolution |
| --- | --- |
| Backend will not start | Confirm `MONGO_URI` is set and MongoDB is reachable. |
| Upload returns sync result unexpectedly | Check Redis and `ASYNC_UPLOAD`; synchronous fallback is deliberate if Redis is unavailable. |
| Queue job fails | Inspect `/api/admin/jobs`, logs, parser health, and temporary-file availability. Retry failed jobs after resolving the root cause. |
| “No answers could be extracted” | Confirm the selected exam and PDF layout; the parser is layout-dependent and expects a valid response sheet. |
| CUET upload rejected | Supply both the response PDF and official answer-key PDF. |
| Admin login fails | Ensure backend `ADMIN_SECRET` matches the entered secret and wait for rate-limit reset after repeated failures. |
| Frontend cannot reach API | Set `VITE_API_BASE_URL` to the backend’s externally reachable URL and rebuild the Vite client. |

## 17. License and authorship

The current package metadata uses the `ISC` license for the backend. The application footer identifies the project as “Exam Analyser” and credits Shrinu Srinivas. Confirm ownership, licensing, privacy policy, and data-retention requirements before a public deployment, since uploaded PDFs and candidate data are persisted in MongoDB.
