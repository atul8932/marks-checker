export function ConfidenceBadge({ confidence }) {
  if (confidence == null) return null;

  const pct = Math.round(confidence * 100);
  let cls = "confidence-high";
  let label = "High Confidence";

  if (confidence < 0.5) {
    cls = "confidence-low";
    label = "Low Confidence";
  } else if (confidence < 0.7) {
    cls = "confidence-medium";
    label = "Medium Confidence";
  }

  return (
    <span className={`confidence-badge ${cls}`}>
      {pct}% — {label}
    </span>
  );
}
