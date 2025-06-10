'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="h-screen w-screen flex items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
            <div className="bg-gray-800 p-4 rounded-md mb-4">
              <p className="font-mono text-sm text-red-400 mb-2">
                {this.state.error?.toString()}
              </p>
              {this.state.errorInfo && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-gray-400 mb-2">Stack trace</summary>
                  <pre className="text-xs text-gray-400 overflow-auto p-2 bg-gray-900 rounded">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
