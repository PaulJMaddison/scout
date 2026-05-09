import type { ErrorInfo, ReactNode } from 'react'
import { Component } from 'react'
import { AlertTriangle, RefreshCcw } from 'lucide-react'
import { Button, Card } from '@/components/ui/primitives'

interface AppErrorBoundaryProps {
  children: ReactNode
}

interface AppErrorBoundaryState {
  hasError: boolean
  errorMessage: string | null
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: null,
    }
  }

  public static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI error', error, errorInfo)
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="flex min-h-screen items-center justify-center px-6 py-12">
        <Card className="max-w-2xl bg-ivory-25">
          <div className="flex size-14 items-center justify-center rounded-[24px] bg-rose-100 text-rose-700">
            <AlertTriangle className="size-6" />
          </div>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-rose-700">
            Interface recovery
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink-950">
            The console hit an unexpected client error.
          </h1>
          <p className="mt-4 text-sm leading-7 text-ink-700">
            The request and API trace may still be available in the backend logs. Refresh the app to recover the session and try the action again.
          </p>
          {this.state.errorMessage ? (
            <pre className="mt-5 overflow-x-auto rounded-[24px] bg-ink-950 px-4 py-4 text-sm text-ivory-100">
              {this.state.errorMessage}
            </pre>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, errorMessage: null })
                window.location.reload()
              }}
            >
              Refresh application
              <RefreshCcw className="ml-2 size-4" />
            </Button>
          </div>
        </Card>
      </main>
    )
  }
}
