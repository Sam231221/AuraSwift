/**
 * Verification Method Types
 * 
 * Standardized verification method enum (uppercase format)
 * 
 * @module types/enums/verification-method
 */

export type VerificationMethod = 'NONE' | 'MANUAL' | 'SCAN' | 'OVERRIDE';

export const VERIFICATION_METHODS: Record<VerificationMethod, string> = {
  NONE: 'No Verification',
  MANUAL: 'Manual Check',
  SCAN: 'ID Scan',
  OVERRIDE: 'Manager Override',
} as const;
