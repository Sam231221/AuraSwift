import { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";

// Lazy import devtools installer only in development
async function getDevToolsInstaller() {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  try {
    const installer = await import("electron-devtools-installer");
    // Type assertion: installer.default is the installExtension function
    // Convert through 'unknown' first to avoid type overlap issues
    const installExtension = installer.default as unknown as (
      extensionId: unknown
    ) => Promise<string>;

    if (typeof installExtension !== "function") {
      return null;
    }

    return {
      installExtension,
      extensions: {
        REDUX_DEVTOOLS: installer.REDUX_DEVTOOLS,
        VUEJS_DEVTOOLS: installer.VUEJS_DEVTOOLS,
        EMBER_INSPECTOR: installer.EMBER_INSPECTOR,
        BACKBONE_DEBUGGER: installer.BACKBONE_DEBUGGER,
        REACT_DEVELOPER_TOOLS: installer.REACT_DEVELOPER_TOOLS,
        JQUERY_DEBUGGER: installer.JQUERY_DEBUGGER,
        MOBX_DEVTOOLS: installer.MOBX_DEVTOOLS,
      } as const,
    };
  } catch {
    return null;
  }
}

export class ChromeDevToolsExtension implements AppModule {
  readonly #extension: string;

  constructor({ extension }: { readonly extension: string }) {
    this.#extension = extension;
  }

  async enable({ app }: ModuleContext): Promise<void> {
    // Skip in production - DevTools extensions are development-only
    if (process.env.NODE_ENV === "production") {
      return;
    }

    const installer = await getDevToolsInstaller();
    if (!installer) {
      // Silently fail in production or if installer is not available
      return;
    }

    await app.whenReady();
    await installer.installExtension(
      installer.extensions[this.#extension as keyof typeof installer.extensions]
    );
  }
}

export function chromeDevToolsExtension(
  ...args: ConstructorParameters<typeof ChromeDevToolsExtension>
) {
  return new ChromeDevToolsExtension(...args);
}
