## NIMCET Marks Checker (modular monorepo)

Monorepo with:
- `frontend/`: React (Vite) UI for upload + results
- `backend/`: Node.js (Express) API + MongoDB persistence
- `parser/`: Python (Flask) PDF parsing service
- `shared/`: JSON configs (answer keys)

## Architecture

Upload PDF → Frontend → `POST /api/upload` (backend) → `POST /parse` (parser) → scoring (backend) → save MongoDB → return result → UI renders results.

## Prerequisites

- Node.js 18+ (recommended)
- Python 3.10+
- A MongoDB Atlas connection string

## Setup

Copy env file:

```bash
cp .env.example .env
```

Edit `.env` and set `MONGO_URI` password + cluster host.

## Run (Parser)

```bash
cd parser
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m app
```

Runs on `http://localhost:5001`.

## Run (Backend)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Runs on `http://localhost:5000`.

## Run (Frontend)

```bash
cd frontend
npm install
npm run dev
```

Open the printed Vite URL (typically `http://localhost:5173`).

## Notes

- Answer key lives in `shared/nimcet_answer_key.json`.
- Parser logic is intentionally modular; extend by adding new exam parsers + answer keys and routing based on `exam`.

