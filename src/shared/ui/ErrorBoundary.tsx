import { Component, type ErrorInfo, type ReactNode } from "react";
import { env } from "@/shared/config/env";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Without this, any render-time throw blanked the whole page. Keeps the app
 * shell alive and offers a reload instead.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (env.isDev) {
      console.error("Unhandled render error", error, info.componentStack);
    }
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-ground px-5">
        <div className="w-full max-w-md border-l border-verm pl-6">
          <p className="font-mono text-micro font-medium tracking-[0.22em] text-verm-ink uppercase">
            Render failed
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-ink">
            This screen stopped drawing
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            Nothing you did caused it, and nothing you wrote was lost. Reloading
            usually clears it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-7 cursor-pointer border border-verm bg-verm px-5 py-2.5 text-sm font-semibold text-on-verm transition-opacity duration-200 hover:opacity-85"
          >
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
