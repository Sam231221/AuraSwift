/**
 * Age Verification API Types - Preload
 *
 * Type definitions for age verification IPC APIs.
 *
 * @module preload/types/api/age-verification
 */

export interface CreateAgeVerificationData {
  transactionId?: string;
  transactionItemId?: string;
  productId: string;
  verificationMethod: "manual" | "scan" | "override";
  customerBirthdate?: Date | string;
  calculatedAge?: number;
  idScanData?: any;
  verifiedBy: string;
  managerOverrideId?: string;
  overrideReason?: string;
  businessId: string;
}

export interface AgeVerificationRecord {
  id: string;
  transactionId?: string | null;
  transactionItemId?: string | null;
  productId: string;
  verificationMethod: "manual" | "scan" | "override";
  customerBirthdate?: Date | null;
  calculatedAge?: number | null;
  idScanData?: any;
  verifiedBy: string;
  managerOverrideId?: string | null;
  overrideReason?: string | null;
  businessId: string;
  verifiedAt: Date;
  createdAt: Date;
  updatedAt: Date | null;
}

export interface GetAgeVerificationsOptions {
  startDate?: Date;
  endDate?: Date;
  verificationMethod?: "manual" | "scan" | "override";
}

export interface AgeVerificationAPIPreload {
  create: (verificationData: CreateAgeVerificationData) => Promise<any>;

  getByTransaction: (transactionId: string) => Promise<any>;

  getByTransactionItem: (transactionItemId: string) => Promise<any>;

  getByBusiness: (
    businessId: string,
    options?: GetAgeVerificationsOptions
  ) => Promise<any>;

  getByProduct: (productId: string) => Promise<any>;

  getByStaff: (
    staffId: string,
    options?: GetAgeVerificationsOptions
  ) => Promise<any>;
}
