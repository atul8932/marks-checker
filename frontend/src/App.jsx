import { useMemo, useState } from "react";
import { HomePage } from "./pages/HomePage";
import { UploadPage } from "./pages/UploadPage";
import { ResultPage } from "./pages/ResultPage";

export default function App() {
  const [route, setRoute] = useState({ name: "home" });

  const content = useMemo(() => {
    if (route.name === "result") {
      return (
        <ResultPage
          result={route.result}
          onBack={() => setRoute({ name: "home" })}
        />
      );
    }

    if (route.name === "upload") {
      return (
        <UploadPage
          examConfig={route.examConfig}
          onResult={(result) => setRoute({ name: "result", result })}
          onBack={() => setRoute({ name: "home" })}
        />
      );
    }

    return (
      <HomePage
        onSelectExam={(exam) => setRoute({ name: "upload", examConfig: exam })}
      />
    );
  }, [route]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div
          className="brand"
          onClick={() => setRoute({ name: "home" })}
          style={{ cursor: "pointer" }}
        >
          <div className="brand-mark" aria-hidden="true" />
          <div className="brand-text">
            <div className="brand-title">EXAM ANALYSER</div>
            <div className="brand-subtitle">Marks & Response Checker</div>
          </div>
        </div>
      </header>

      <main className="app-main">{content}</main>

      <footer className="app-footer">
        <span>created by Atul Kumar</span>
      </footer>
    </div>
  );
}
