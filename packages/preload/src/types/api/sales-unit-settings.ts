/**
 * Sales Unit Mode - Fixed or Varying
 */
export type SalesUnitMode = "Fixed" | "Varying";

/**
 * Sales Unit - Available unit types
 */
export type SalesUnit = "PIECE" | "KG" | "GRAM" | "LITRE" | "ML" | "PACK";

/**
 * Sales Unit Setting - Database model structure
 * Matches the schema definition in packages/main/src/database/schema.ts
 * Note: Field names match database columns (salesUnitMode, fixedSalesUnit)
 */
export interface SalesUnitSetting {
  id: string;
  businessId: string;
  salesUnitMode: SalesUnitMode;
  fixedSalesUnit: SalesUnit;
  createdAt: Date | string | number;
  updatedAt: Date | string | number | null;
}

/**
 * Sales Unit Settings Data - For create/update operations
 * Field names match database columns
 */
export interface SalesUnitSettingsData {
  salesUnitMode?: SalesUnitMode;
  fixedSalesUnit?: SalesUnit;
}

/**
 * Sales Unit Settings API Response
 */
export interface SalesUnitSettingsResponse {
  success: boolean;
  settings?: SalesUnitSetting;
  message?: string;
}

export interface SalesUnitSettingsAPI {
  get: (businessId: string) => Promise<SalesUnitSettingsResponse>;
  createOrUpdate: (
    businessId: string,
    settingsData: SalesUnitSettingsData
  ) => Promise<SalesUnitSettingsResponse>;
}
