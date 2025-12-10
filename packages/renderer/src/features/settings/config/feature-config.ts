/**
 * Settings Feature Configuration
 *
 * Central configuration for the settings feature.
 * This is used by the navigation system and dashboard.
 */

import { Settings, CreditCard } from "lucide-react";
import { SETTINGS_PERMISSIONS } from "./permissions";
import { SETTINGS_ROUTES } from "./navigation";
import type { FeatureConfig } from "@/features/dashboard/types/feature-config";
import type { ViewConfig } from "@/navigation/types";
import GeneralSettingsView from "../views/general-settings-view";
import VivaWalletSettingsView from "../views/viva-wallet-settings-view";

/**
 * Settings Feature Configuration for Dashboard
 */
export const settingsFeature: FeatureConfig = {
  id: "system-settings",
  title: "System Settings",
  description: "Manage system and business settings",
  icon: Settings,
  permissions: [SETTINGS_PERMISSIONS.MANAGE],
  category: "settings",
  order: 10,
  actions: [
    {
      id: "general-settings",
      label: "General Settings",
      icon: Settings,
      onClick: () => {}, // Will be injected by dashboard
      permissions: [SETTINGS_PERMISSIONS.MANAGE],
    },
    {
      id: "viva-wallet-settings",
      label: "Viva Wallet",
      icon: CreditCard,
      onClick: () => {}, // Will be injected by dashboard
      permissions: [SETTINGS_PERMISSIONS.MANAGE],
    },
  ],
};

/**
 * Settings Views Registry
 *
 * All views for the settings feature are registered here.
 * This is spread into the main VIEW_REGISTRY.
 */
export const settingsViews: Record<string, ViewConfig> = {
  [SETTINGS_ROUTES.GENERAL]: {
    id: SETTINGS_ROUTES.GENERAL,
    level: "root",
    component: GeneralSettingsView,
    metadata: {
      title: "General Settings",
      description: "System settings",
    },
    permissions: [SETTINGS_PERMISSIONS.MANAGE],
    roles: ["admin"],
    requiresAuth: true,
    cacheable: true,
  },
  [SETTINGS_ROUTES.VIVA_WALLET]: {
    id: SETTINGS_ROUTES.VIVA_WALLET,
    level: "root",
    component: VivaWalletSettingsView,
    metadata: {
      title: "Viva Wallet Settings",
      description: "Configure Viva Wallet payment terminals",
    },
    permissions: [SETTINGS_PERMISSIONS.MANAGE],
    roles: ["admin"],
    requiresAuth: true,
    cacheable: true,
  },
};
