# Project Structure

This document captures the current high-level structure of the `marks-analyser` project.

Excluded from this tree for readability:
- `node_modules`
- `dist`
- `.venv`
- `__pycache__`
- `.git`
- `build`
- `coverage`

```text
marks-analyser/
├── .gitignore
├── README.md
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── Dockerfile.parser
├── nginx-frontend.conf
├── requirements.txt
├── debug_page.html
├── nimcet_scraper.py
├── simple_nimcet_scraper.py
├── organized_nimcet_data.py
├── nimcet_data.json
├── nimcet_organized_data.json
├── nimcet_college_summary.json
├── shared/
│   └── nimcet_answer_key.json
├── backend/
│   ├── .env
│   ├── check_db.js
│   ├── package.json
│   ├── package-lock.json
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── db.js
│       │   ├── env.js
│       │   └── redis.js
│       ├── controllers/
│       │   ├── adminController.js
│       │   ├── jobController.js
│       │   ├── recalculateController.js
│       │   ├── resultController.js
│       │   └── uploadController.js
│       ├── jobs/
│       │   ├── bullBoard.js
│       │   ├── parseWorker.js
│       │   ├── queues.js
│       │   └── workerEntry.js
│       ├── middleware/
│       │   ├── adminAuth.js
│       │   ├── cache.js
│       │   └── errorHandler.js
│       ├── models/
│       │   └── Result.js
│       ├── routes/
│       │   ├── admin.js
│       │   ├── job.js
│       │   ├── recalculate.js
│       │   ├── result.js
│       │   └── upload.js
│       ├── services/
│       │   ├── answerKey.js
│       │   ├── parserClient.js
│       │   ├── scoring.js
│       │   ├── pipelines/
│       │   │   ├── cuetPipeline.js
│       │   │   ├── nimcetPipeline.js
│       │   │   └── rrbPipeline.js
│       │   └── validation/
│       │       └── nimcetResponseValidation.js
│       └── utils/
│           ├── asyncHandler.js
│           ├── circuitBreaker.js
│           ├── logger.js
│           └── tempFiles.js
├── frontend/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── README.md
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       ├── AdminApp.jsx
│       ├── index.css
│       ├── api/
│       │   ├── adminApi.js
│       │   └── client.js
│       ├── assets/
│       │   ├── brandlogos.png
│       │   ├── hero.png
│       │   ├── marks-analyser.png
│       │   ├── react.svg
│       │   └── vite.svg
│       ├── components/
│       │   ├── ConfidenceBadge.jsx
│       │   ├── ProgressBar.jsx
│       │   ├── Spinner.jsx
│       │   ├── StatCard.jsx
│       │   └── admin/
│       │       ├── AdminErrorBoundary.jsx
│       │       ├── AdminLayout.jsx
│       │       ├── AdminLoader.jsx
│       │       ├── AdminStatCard.jsx
│       │       ├── DataTable.jsx
│       │       ├── JobStatusBadge.jsx
│       │       └── Sidebar.jsx
│       └── pages/
│           ├── HomePage.jsx
│           ├── LandingPage.jsx
│           ├── ResultPage.jsx
│           ├── UploadPage.jsx
│           └── admin/
│               ├── AdminAnalytics.jsx
│               ├── AdminDashboard.jsx
│               ├── AdminHealth.jsx
│               ├── AdminJobs.jsx
│               ├── AdminLogin.jsx
│               └── AdminResults.jsx
└── parser/
    ├── __init__.py
    ├── app.py
    ├── requirements.txt
    ├── routes/
    │   └── parse.py
    ├── services/
    │   ├── extract_text.py
    │   ├── parse_cuet.py
    │   ├── parse_nimcet.py
    │   ├── parse_rrb.py
    │   └── validator.py
    └── utils/
        └── http_errors.py
```
