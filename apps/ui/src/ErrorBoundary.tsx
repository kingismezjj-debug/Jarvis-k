import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  public state: ErrorBoundaryState = { error: null };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("Jarvis-K renderer error", error, info.componentStack);
  }

  public render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
        <section
          className="w-full max-w-xl rounded-md border bg-card p-5 shadow-sm"
          data-testid="render-error-boundary"
        >
          <p className="text-sm font-semibold">Renderer recovered</p>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            Jarvis-K caught a renderer view error instead of leaving a blank
            screen. Restart the app after reporting this message.
          </p>
          <pre
            className="mt-4 max-h-48 overflow-auto rounded-md border bg-muted p-3 text-[11px]"
            data-testid="render-error-message"
          >
            {this.state.error.message}
          </pre>
        </section>
      </main>
    );
  }
}
