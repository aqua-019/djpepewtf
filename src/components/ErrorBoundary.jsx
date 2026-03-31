import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: 'var(--txt3, #888)',
          fontFamily: 'var(--font-body, sans-serif)',
        }}>
          <h2 style={{ color: 'var(--red, #ff4444)', fontSize: 18, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 12, marginBottom: 16 }}>
            Try refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            style={{
              padding: '6px 16px',
              fontSize: 11,
              background: 'transparent',
              border: '1px solid rgba(61,255,110,0.25)',
              color: 'var(--green, #3dff6e)',
              borderRadius: 20,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
