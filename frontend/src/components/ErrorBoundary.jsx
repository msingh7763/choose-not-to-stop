import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-error', {
        detail: {
          name: error?.name || 'RenderError',
          message: error?.message || 'Render failed',
          stack: error?.stack,
          source: 'react-error-boundary',
          componentStack: errorInfo?.componentStack,
        },
      }));
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-navy-900 text-gray-100">
          <div className="glass-strong max-w-lg w-full p-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-3">Something went wrong</h1>
            <p className="text-gray-300 mb-6">
              We logged this issue. Please refresh the page and try again.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
