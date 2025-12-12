import { ipcRenderer } from "electron";
import type { SeedPreset, SeedConfig, SeedResponse } from "../../types/seed.js";

/**
 * Seed API - Database seeding for categories and products
 *
 * Use from DevTools console:
 * @example
 * ```javascript
 * await seedAPI.runPreset('small');
 * await seedAPI.runCustom({ categories: 100, products: 500 });
 * ```
 */
export const seedAPI = {
  /**
   * Seed categories and products with a preset configuration
   * @param preset - "minimal" (50/500), "small" (200/2k), "medium" (1k/10k), "large" (5k/30k), "xlarge" (10k/60k)
   */
  runPreset: (preset: SeedPreset): Promise<SeedResponse> =>
    ipcRenderer.invoke("seed:run", preset),

  /**
   * Seed with custom configuration
   */
  runCustom: (config: SeedConfig): Promise<SeedResponse> =>
    ipcRenderer.invoke("seed:custom", {
      categories: config.categories,
      products: config.products,
      batchSize: config.batchSize || 200,
      clearExisting: config.clearExisting !== false,
    }),
};
