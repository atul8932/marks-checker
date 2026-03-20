const STATUS_CONFIG = {
  completed: { label: "Completed", cls: "badge-green" },
  active:    { label: "Active",    cls: "badge-yellow" },
  waiting:   { label: "Waiting",   cls: "badge-yellow" },
  delayed:   { label: "Delayed",   cls: "badge-muted" },
  failed:    { label: "Failed",    cls: "badge-red" },
  unknown:   { label: "Unknown",   cls: "badge-muted" },
};

export function JobStatusBadge({ status }) {
  const { label, cls } = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  return <span className={`admin-badge ${cls}`}>{label}</span>;
}
