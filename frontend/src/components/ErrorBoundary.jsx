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
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#DCE1DA] via-[#F4DDD5] to-[#DCE1DA] text-black">
          <div className="glass-strong max-w-lg w-full p-8 text-center border border-[#A4BBAC]">
            <h1 className="text-2xl font-black text-black mb-3">Something went wrong</h1>
            <p className="text-black font-semibold mb-6">
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
