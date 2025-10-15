// ✨ Error Boundary Component for graceful error handling
import React from 'react';
import { motion } from 'framer-motion';
import '../styles/ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <motion.div 
            className="error-boundary-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry for the inconvenience. The application encountered an unexpected error.
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <motion.button
                className="btn-primary"
                onClick={this.handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Go to Home
              </motion.button>
              <motion.button
                className="btn-secondary"
                onClick={() => window.location.reload()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Reload Page
              </motion.button>
            </div>
          </motion.div>

          <style jsx>{`
            .error-boundary-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 2rem;
            }

            .error-boundary-content {
              background: white;
              border-radius: 20px;
              padding: 3rem;
              max-width: 600px;
              width: 100%;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
              text-align: center;
            }

            .error-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
              animation: pulse 2s infinite;
            }

            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }

            .error-boundary-content h1 {
              color: #333;
              margin-bottom: 1rem;
              font-size: 2rem;
            }

            .error-message {
              color: #666;
              margin-bottom: 2rem;
              line-height: 1.6;
            }

            .error-details {
              text-align: left;
              margin: 2rem 0;
              padding: 1rem;
              background: #f5f5f5;
              border-radius: 8px;
              cursor: pointer;
            }

            .error-details summary {
              font-weight: 600;
              color: #667eea;
              margin-bottom: 0.5rem;
            }

            .error-stack {
              margin-top: 1rem;
              padding: 1rem;
              background: #fff;
              border-radius: 4px;
              overflow-x: auto;
              font-size: 0.875rem;
              color: #e53e3e;
              white-space: pre-wrap;
              word-break: break-word;
            }

            .error-actions {
              display: flex;
              gap: 1rem;
              justify-content: center;
              flex-wrap: wrap;
            }

            .btn-primary, .btn-secondary {
              padding: 0.75rem 2rem;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.3s ease;
            }

            .btn-primary {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }

            .btn-secondary {
              background: #f5f5f5;
              color: #333;
            }

            @media (max-width: 768px) {
              .error-boundary-content {
                padding: 2rem;
              }

              .error-boundary-content h1 {
                font-size: 1.5rem;
              }

              .error-actions {
                flex-direction: column;
              }

              .btn-primary, .btn-secondary {
                width: 100%;
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;