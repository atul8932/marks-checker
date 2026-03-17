export function Spinner({ label = "Loading…" }) {
  return (
    <div className="spinner-row" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true" />
      <span className="spinner-label">{label}</span>
    </div>
  );
}

