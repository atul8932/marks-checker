export function AdminLoader({ message = "Loading..." }) {
  return (
    <div className="admin-loader">
      <div className="admin-spinner" />
      <span className="admin-loader-text">{message}</span>
    </div>
  );
}
