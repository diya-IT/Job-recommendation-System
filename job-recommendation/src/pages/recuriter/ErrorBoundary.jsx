import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{padding: 24, background: '#fff7f0', borderRadius: 12, border: '1px solid #ffd2b3'}}>
          <h3 style={{marginTop:0}}>Something went wrong in Insights</h3>
          <p style={{color:'#6b7280'}}>The insights module encountered an error and couldn't load. Check the console for details.</p>
          <pre style={{whiteSpace:'pre-wrap', color:'#9CA3AF'}}>{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;