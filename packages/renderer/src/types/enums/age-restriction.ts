/**
 * Age Restriction Types and Configuration
 * 
 * Single source of truth for age restriction levels.
 * 
 * @module types/enums/age-restriction
 */

export type AgeRestrictionLevel = 'NONE' | 'AGE_16' | 'AGE_18' | 'AGE_21';

export interface AgeRestrictionConfig {
  level: AgeRestrictionLevel;
  minAge: number;
  label: string;
  color: string;
}

export const AGE_RESTRICTIONS: Record<AgeRestrictionLevel, AgeRestrictionConfig> = {
  NONE: { level: 'NONE', minAge: 0, label: 'No Restriction', color: 'gray' },
  AGE_16: { level: 'AGE_16', minAge: 16, label: '16+', color: 'blue' },
  AGE_18: { level: 'AGE_18', minAge: 18, label: '18+', color: 'orange' },
  AGE_21: { level: 'AGE_21', minAge: 21, label: '21+', color: 'red' },
} as const;

/**
 * Helper function to get minimum age for a restriction level
 */
export function getMinimumAge(level: AgeRestrictionLevel): number {
  return AGE_RESTRICTIONS[level].minAge;
}

/**
 * Helper function to get label for a restriction level
 */
export function getAgeRestrictionLabel(level: AgeRestrictionLevel): string {
  return AGE_RESTRICTIONS[level].label;
}

/**
 * Helper function to get color for a restriction level
 */
export function getAgeRestrictionColor(level: AgeRestrictionLevel): string {
  return AGE_RESTRICTIONS[level].color;
}
