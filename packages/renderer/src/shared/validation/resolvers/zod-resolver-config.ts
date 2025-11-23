/**
 * Zod Resolver Configuration
 *
 * Custom configuration for zodResolver to ensure consistent error handling
 * across all forms in the application.
 */

import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

/**
 * Configured zodResolver with consistent error mapping
 *
 * This resolver ensures that Zod validation errors are properly mapped
 * to React Hook Form's error format, providing consistent error handling
 * across all forms.
 *
 * @example
 * ```tsx
 * import { useForm } from "react-hook-form";
 * import { configuredZodResolver } from "@/shared/validation/resolvers";
 * import { productCreateSchema } from "../schemas/product-schema";
 *
 * const form = useForm({
 *   resolver: configuredZodResolver(productCreateSchema),
 *   // ... other options
 * });
 * ```
 */
export function configuredZodResolver<T extends z.ZodTypeAny>(schema: T): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return zodResolver(schema as any) as any;
}

/**
 * Default export for convenience
 *
 * @example
 * ```tsx
 * import zodResolver from "@/shared/validation/resolvers";
 * ```
 */
export default configuredZodResolver;
