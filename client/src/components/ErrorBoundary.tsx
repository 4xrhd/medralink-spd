import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Icon } from '../ui/primitives.js';

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
          <div className="w-full max-w-lg rounded-2xl border border-[#FECACA] bg-white p-6 sm:p-8 shadow-xl">
            <div className="flex items-center gap-3 text-[#DC2626]">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#FEF2F2] border border-[#FECACA]">
                <Icon.Alert size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold font-display text-[#0F172A]">
                  Clinical Portal Runtime Notice
                </h1>
                <p className="text-xs text-[#64748B]">
                  Diagnostic event captured • Integrity safeguarded
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-[#475569] leading-relaxed">
              An unexpected runtime exception occurred while rendering this interface. Your data
              and ledger session remain protected under secure transaction integrity protocols.
            </p>

            {this.state.error && (
              <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                <summary className="cursor-pointer font-semibold text-[#1B365D] hover:underline select-none">
                  View Technical Diagnostics
                </summary>
                <div className="mt-2 font-mono text-[11px] text-[#DC2626] whitespace-pre-wrap overflow-x-auto max-h-40 bg-white p-2.5 rounded border border-slate-200">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </div>
              </details>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 rounded-xl bg-[#1B365D] px-4 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-[#152a48] transition-colors focus-visible:ring-2 focus-visible:ring-[#2563EB]"
              >
                Retry Component
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] shadow-xs hover:bg-slate-50 hover:text-[#0F172A] transition-colors"
              >
                Reload Session
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] shadow-xs hover:bg-slate-50 hover:text-[#0F172A] transition-colors"
              >
                Safe Return
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
