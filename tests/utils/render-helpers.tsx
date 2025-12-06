/**
 * React Testing Utilities
 *
 * Custom render function with common providers for component testing.
 * This ensures consistent test setup across all component tests.
 */

import { render as rtlRender, RenderOptions } from "@testing-library/react";
import { ReactElement } from "react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Custom render options
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  /**
   * Initial route for MemoryRouter
   */
  initialRoute?: string;

  /**
   * QueryClient instance (creates new one if not provided)
   */
  queryClient?: QueryClient;

  /**
   * Additional wrapper component
   */
  additionalWrapper?: React.ComponentType<{ children: React.ReactNode }>;
}

/**
 * Custom render function that wraps components with common providers
 *
 * @example
 * ```tsx
 * render(<MyComponent />, { initialRoute: '/dashboard' });
 * ```
 */
export function render(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): ReturnType<typeof rtlRender> {
  const {
    initialRoute = "/",
    queryClient = createTestQueryClient(),
    additionalWrapper,
    ...renderOptions
  } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrappedChildren = (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </QueryClientProvider>
    );

    if (additionalWrapper) {
      const AdditionalWrapper = additionalWrapper;
      wrappedChildren = (
        <AdditionalWrapper>{wrappedChildren}</AdditionalWrapper>
      );
    }

    return wrappedChildren;
  }

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create a test QueryClient with sensible defaults
 */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Don't retry in tests
        gcTime: Infinity, // Don't garbage collect
        staleTime: Infinity, // Never become stale
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: () => {},
      warn: () => {},
      error: () => {}, // Silence errors in tests
    },
  });
}

/**
 * Wait for async operations to complete
 * Useful after triggering actions that update state asynchronously
 */
export async function waitForAsync(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Re-export everything from RTL for convenience
 */
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
