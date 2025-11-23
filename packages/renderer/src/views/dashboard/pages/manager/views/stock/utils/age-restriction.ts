/**
 * Age Restriction Utilities
 */

import type { AgeRestrictionLevel, AgeRestrictionConfig } from "../types/age-restriction.types";

export const AGE_RESTRICTIONS: Record<AgeRestrictionLevel, AgeRestrictionConfig> = {
  NONE: { level: "NONE", minAge: 0, label: "No Restriction", color: "gray" },
  AGE_16: { level: "AGE_16", minAge: 16, label: "16+", color: "blue" },
  AGE_18: { level: "AGE_18", minAge: 18, label: "18+", color: "orange" },
  AGE_21: { level: "AGE_21", minAge: 21, label: "21+", color: "red" },
};

/**
 * Get the minimum age for a given age restriction level
 */
export function getMinimumAge(level: AgeRestrictionLevel): number {
  return AGE_RESTRICTIONS[level].minAge;
}

/**
 * Calculate age from birth date
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if a customer meets the age requirement
 */
export function meetsAgeRequirement(
  ageRestrictionLevel: AgeRestrictionLevel,
  customerAge: number
): boolean {
  if (ageRestrictionLevel === "NONE") {
    return true;
  }

  const minAge = getMinimumAge(ageRestrictionLevel);
  return customerAge >= minAge;
}

/**
 * Get the highest age restriction from a list of products
 */
export function getHighestAgeRestriction(
  products: Array<{ ageRestrictionLevel?: AgeRestrictionLevel }>
): AgeRestrictionLevel {
  const levels: AgeRestrictionLevel[] = products
    .map((p) => p.ageRestrictionLevel || "NONE")
    .filter((level) => level !== "NONE") as AgeRestrictionLevel[];

  if (levels.length === 0) {
    return "NONE";
  }

  // Sort by minimum age descending
  levels.sort((a, b) => {
    const ageA = getMinimumAge(a);
    const ageB = getMinimumAge(b);
    return ageB - ageA;
  });

  return levels[0];
}

/**
 * Format age restriction label with color indicator
 */
export function getAgeRestrictionLabel(level: AgeRestrictionLevel): string {
  const restriction = AGE_RESTRICTIONS[level];
  if (level === "NONE") {
    return restriction.label;
  }
  return `${restriction.label} (${restriction.minAge}+)`;
}

/**
 * Get age restriction color for UI display
 */
export function getAgeRestrictionColor(level: AgeRestrictionLevel): string {
  return AGE_RESTRICTIONS[level].color;
}

