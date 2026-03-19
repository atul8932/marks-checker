import { useMemo, useState, useEffect } from "react";
import { LandingPage } from "./pages/LandingPage";
import { HomePage } from "./pages/HomePage";
import { UploadPage } from "./pages/UploadPage";
import { ResultPage } from "./pages/ResultPage";
import { api } from "./api/client";

export default function App() {
  const [route, setRoute] = useState({ name: "landing" });

  // Handle shared links: ?resultId=<id>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resultId = params.get("resultId");
    if (!resultId) return;

    window.history.replaceState({}, "", window.location.pathname);

    api.get(`/api/result/${resultId}`)
      .then(resp => setRoute({ name: "result", result: resp.data }))
      .catch(() => {});
  }, []);

  const content = useMemo(() => {
    if (route.name === "result") {
      return (
        <ResultPage
          result={route.result}
          onBack={() => setRoute({ name: "hub" })}
        />
      );
    }

    if (route.name === "upload") {
      return (
        <UploadPage
          examConfig={route.examConfig}
          onResult={(result) => setRoute({ name: "result", result })}
          onBack={() => setRoute({ name: "hub" })}
        />
      );
    }

    if (route.name === "hub") {
      return (
        <HomePage
          onSelectExam={(exam) => setRoute({ name: "upload", examConfig: exam })}
        />
      );
    }

    // Default: landing page
    return (
      <LandingPage
        onGetStarted={() => setRoute({ name: "hub" })}
      />
    );
  }, [route]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div
          className="brand"
          onClick={() => setRoute({ name: "landing" })}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <div className="brand-title">EXAM ANALYSER</div>
            <div className="brand-subtitle">Marks &amp; Response Checker</div>
          </div>
        </div>
      </header>

      <main className="app-main">{content}</main>

      <footer className="app-footer">
        <span>© 2026 Exam Analyser · Built by Atul Kumar and Aditya Raj</span>
      </footer>
    </div>
  );
}
