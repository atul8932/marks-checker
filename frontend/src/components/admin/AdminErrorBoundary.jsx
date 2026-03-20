import { Component } from "react";

export class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("[AdminErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-error-boundary">
          <div className="admin-error-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            className="button primary"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
