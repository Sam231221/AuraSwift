import { ipcRenderer } from "electron";
import type { SalesUnitSetting } from "@/types/domain/sales-unit";

export interface SalesUnitSettingsResponse {
  success: boolean;
  settings?: SalesUnitSetting;
  message?: string;
}

export const salesUnitSettingsAPI = {
  get: (businessId: string): Promise<SalesUnitSettingsResponse> =>
    ipcRenderer.invoke("salesUnitSettings:get", businessId),

  createOrUpdate: (
    businessId: string,
    settingsData: Partial<
      Omit<SalesUnitSetting, "id" | "businessId" | "createdAt" | "updatedAt">
    >
  ): Promise<SalesUnitSettingsResponse> =>
    ipcRenderer.invoke(
      "salesUnitSettings:createOrUpdate",
      businessId,
      settingsData
    ),
};
