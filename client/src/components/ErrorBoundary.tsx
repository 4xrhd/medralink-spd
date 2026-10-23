import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button, Icon } from '../ui/primitives.js';

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
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[80vh] flex items-center justify-center p-4 sm:p-6"
        >
          <div className="w-full max-w-lg rounded-xl border border-hair bg-white p-6 shadow-card sm:p-8">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-rose-200 bg-rose-50 text-critical">
                <Icon.Alert size={20} />
              </div>
              <h1 className="font-display text-lg font-semibold text-ink-900">This screen could not be shown</h1>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-ink-600">
              Something went wrong while loading this page. Nothing you saved has been lost. Try again, or reload the page.
            </p>

            {/* Technical details only in development builds, never to patients or doctors in production */}
            {import.meta.env.DEV && this.state.error && (
              <details className="mt-4 rounded-md border border-hair bg-canvas p-3 text-xs">
                <summary className="cursor-pointer select-none font-semibold text-primary-700">Technical details</summary>
                <div className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded border border-hair bg-white p-2.5 font-mono text-[0.6875rem] text-critical">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}

            <div className="mt-6 grid gap-2 sm:flex">
              <Button onClick={this.handleReset}>Try again</Button>
              <Button variant="secondary" onClick={this.handleReload}>Reload page</Button>
              <Button variant="ghost" onClick={this.handleGoHome}>Go to home</Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
