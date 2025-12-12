import { ipcRenderer } from "electron";

export const dashboardAPI = {
  getStatistics: (sessionToken: string, businessId: string) =>
    ipcRenderer.invoke("dashboard:getStatistics", sessionToken, businessId),
};
