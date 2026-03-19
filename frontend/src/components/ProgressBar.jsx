export function ProgressBar({ value, max = 100, variant = "" }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`progress-bar ${variant}`}>
      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
