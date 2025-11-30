/**
 * Feature Configuration Types
 * 
 * Type definitions for dashboard feature configurations.
 * These types define the structure of features in the feature registry.
 */

import type { LucideIcon } from "lucide-react";

export type FeatureCategory = "actions" | "management" | "reports" | "settings" | "stats";

export interface FeatureAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  permissions?: string[]; // Optional: action-specific permissions
  variant?: "default" | "outline" | "destructive";
  disabled?: boolean;
}

export interface FeatureStats {
  label: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
}

export interface FeatureConfig {
  id: string; // Unique identifier
  title: string; // Card title
  description: string; // Card description
  icon: LucideIcon; // Icon component
  permissions: string[]; // Required permissions (any of these)
  requiredAll?: boolean; // If true, requires ALL permissions
  category: FeatureCategory;
  actions: FeatureAction[]; // Actions/buttons in the card
  stats?: FeatureStats; // Optional stats to display
  order?: number; // Display order
  gridCols?: 1 | 2 | 3 | 4; // Grid column span
}

