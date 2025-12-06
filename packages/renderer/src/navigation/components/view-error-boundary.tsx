import { Component, type ReactNode } from "react";
import { getLogger } from "@/shared/utils/logger";

const logger = getLogger("view-error-boundary");

interface ViewErrorBoundaryProps {
  children: ReactNode;
  viewId?: string;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ViewErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary for View Components
 *
 * Catches errors during component rendering and lazy loading.
 * Provides fallback UI and error recovery.
 */
export class ViewErrorBoundary extends Component<
  ViewErrorBoundaryProps,
  ViewErrorBoundaryState
> {
  constructor(props: ViewErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ViewErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error(
      `View error boundary caught error${
        this.props.viewId ? ` in view: ${this.props.viewId}` : ""
      }`,
      { error, errorInfo }
    );
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold mb-2 text-destructive">
              View Error
            </h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error.message || "An error occurred"}
            </p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-primary text-primary-foreground rounded"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
