import type { APIResponse } from "./common";

export interface DashboardStatistics {
  revenue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  salesToday: number;
  averageOrderValue: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
}

export interface DashboardAPI {
  getStatistics: (
    sessionToken: string,
    businessId: string
  ) => Promise<APIResponse<DashboardStatistics>>;
}
