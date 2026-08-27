import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  /** If true, renders a compact inline fallback instead of a full-screen one */
  inline?: boolean
  /** Custom message for the inline fallback */
  fallbackMessage?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log to console for debugging
    console.error('[ErrorBoundary] Caught error:', error)
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack)

    // TODO: Wire into a real error-tracking service (e.g. Sentry) here.
    // Example:
    //   Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    // ── Inline / page-level fallback ───────────────────────────────
    if (this.props.inline) {
      return (
        <div className="card p-8 border-error/20 bg-error/5 max-w-xl mx-auto my-8">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-12 w-12 rounded-full bg-error/10 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-error" />
            </div>
            <div>
              <h3 className="font-display font-medium text-base mb-1">
                {this.props.fallbackMessage || "Couldn't display this content"}
              </h3>
              <p className="text-sm text-text-muted">
                Something went wrong rendering this section. The rest of the app should still work.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={this.handleReset} className="btn-primary text-sm">
                <RefreshCw className="h-4 w-4" /> Try again
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <pre className="mt-4 text-xs text-error/80 bg-bg-elev rounded-[2px] p-3 max-w-full overflow-x-auto text-left w-full">
                {this.state.error.message}
              </pre>
            )}
          </div>
        </div>
      )
    }

    // ── Full-screen / app-level fallback ──────────────────────────
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="h-16 w-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="h-8 w-8 text-error" />
          </div>
          <h1 className="font-display text-2xl font-semibold text-text mb-2">
            Something went wrong on our end
          </h1>
          <p className="text-text-muted text-sm mb-8 leading-relaxed">
            An unexpected error prevented this page from rendering.
            Your data is safe — try reloading or heading back to the dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={this.handleReload} className="btn-primary w-full sm:w-auto">
              <RefreshCw className="h-4 w-4" /> Reload page
            </button>
            <a href="/" className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2">
              <Home className="h-4 w-4" /> Go to home
            </a>
          </div>
          {import.meta.env.DEV && this.state.error && (
            <pre className="mt-8 text-xs text-error/80 bg-bg-elev rounded-[2px] p-4 max-w-full overflow-x-auto text-left">
              {this.state.error.message}
              {'\n'}
              {this.state.error.stack}
            </pre>
          )}
        </div>
      </div>
    )
  }
}
