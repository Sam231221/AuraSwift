import { ipcRenderer } from "electron";

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

export const ageVerificationAPI = {
  create: (verificationData: CreateAgeVerificationData) =>
    ipcRenderer.invoke("ageVerification:create", verificationData),

  getByTransaction: (transactionId: string) =>
    ipcRenderer.invoke("ageVerification:getByTransaction", transactionId),

  getByTransactionItem: (transactionItemId: string) =>
    ipcRenderer.invoke(
      "ageVerification:getByTransactionItem",
      transactionItemId
    ),

  getByBusiness: (businessId: string, options?: GetAgeVerificationsOptions) =>
    ipcRenderer.invoke("ageVerification:getByBusiness", businessId, options),

  getByProduct: (productId: string) =>
    ipcRenderer.invoke("ageVerification:getByProduct", productId),

  getByStaff: (staffId: string, options?: GetAgeVerificationsOptions) =>
    ipcRenderer.invoke("ageVerification:getByStaff", staffId, options),
};

