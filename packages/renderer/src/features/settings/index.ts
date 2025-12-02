/**
 * Settings Feature - Public API
 *
 * This is the main entry point for the settings feature.
 * Export all public APIs here for easy importing.
 */

// ============================================================================
// Config
// ============================================================================
export { settingsFeature, settingsViews } from "./config/feature-config";
export { SETTINGS_PERMISSIONS } from "./config/permissions";
export { SETTINGS_ROUTES } from "./config/navigation";
export type { SettingsPermission } from "./config/permissions";
export type { SettingsRoute } from "./config/navigation";

// ============================================================================
// Views
// ============================================================================
export { default as GeneralSettingsView } from "./views/general-settings-view";

