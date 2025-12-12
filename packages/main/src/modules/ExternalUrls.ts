import { AppModule } from "../AppModule.js";
import { ModuleContext } from "../ModuleContext.js";
import { shell } from "electron";
import { URL } from "node:url";
import { getLogger } from "../utils/logger.js";

const logger = getLogger("external-urls");

export class ExternalUrls implements AppModule {
  readonly #externalUrls: Set<string>;

  constructor(externalUrls: Set<string>) {
    this.#externalUrls = externalUrls;
  }

  enable({ app }: ModuleContext): Promise<void> | void {
    app.on("web-contents-created", (_, contents) => {
      contents.setWindowOpenHandler(({ url }) => {
        const { origin } = new URL(url);

        if (this.#externalUrls.has(origin)) {
          shell
            .openExternal(url)
            .catch((error) =>
              logger.error("Failed to open external URL", error)
            );
        } else if (process.env.NODE_ENV === "development") {
          logger.warn(
            `Blocked the opening of a disallowed external origin: ${origin}`
          );
        }

        // Prevent creating a new window.
        return { action: "deny" };
      });
    });
  }
}

export function allowExternalUrls(
  ...args: ConstructorParameters<typeof ExternalUrls>
) {
  return new ExternalUrls(...args);
}
