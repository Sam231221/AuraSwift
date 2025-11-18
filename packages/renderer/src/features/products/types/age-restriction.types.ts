/**
 * Age Restriction Types
 */

export type AgeRestrictionLevel = "NONE" | "AGE_16" | "AGE_18" | "AGE_21";

export type VerificationMethod = "manual" | "scan" | "override";

export interface AgeRestrictionConfig {
  level: AgeRestrictionLevel;
  minAge: number;
  label: string;
  color: string;
}

export const AGE_RESTRICTIONS: Record<AgeRestrictionLevel, AgeRestrictionConfig> = {
  NONE: { id: "NONE", minAge: 0, label: "No Restriction", color: "gray" },
  AGE_16: { id: "AGE_16", minAge: 16, label: "16+", color: "blue" },
  AGE_18: { id: "AGE_18", minAge: 18, label: "18+", color: "orange" },
  AGE_21: { id: "AGE_21", minAge: 21, label: "21+", color: "red" },
} as const;

export interface AgeVerificationData {
  method: VerificationMethod;
  birthDate?: Date | string;
  calculatedAge?: number;
  idScanData?: Record<string, unknown>;
  overrideReason?: string;
  managerId?: string;
}

export interface AgeVerificationRecord {
  id: string;
  transactionId?: string;
  transactionItemId?: string;
  productId: string;
  verificationMethod: VerificationMethod;
  customerBirthdate?: Date | string;
  calculatedAge?: number;
  idScanData?: Record<string, unknown>;
  verifiedBy: string;
  managerOverrideId?: string;
  overrideReason?: string;
  businessId: string;
  verifiedAt: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

