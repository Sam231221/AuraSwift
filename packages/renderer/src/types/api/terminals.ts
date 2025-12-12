import type { APIResponse } from "./common";

export interface Terminal {
  id: string;
  business_id: string;
  name: string;
  type: "pos" | "kiosk" | "handheld" | "kitchen_display" | "server";
  status: "active" | "inactive" | "maintenance" | "decommissioned";
  device_token?: string | null;
  ip_address?: string | null;
  mac_address?: string | null;
  settings?: any;
  last_active_at?: number | null;
  created_at: number;
  updated_at?: number | null;
}

export interface TerminalUpdateData {
  name?: string;
  type?: "pos" | "kiosk" | "handheld" | "kitchen_display" | "server";
  status?: "active" | "inactive" | "maintenance" | "decommissioned";
  deviceToken?: string;
  ipAddress?: string;
  macAddress?: string;
  settings?: any;
}

export interface TerminalsAPI {
  getByBusiness: (
    sessionToken: string,
    businessId: string
  ) => Promise<APIResponse & { terminals?: Terminal[] }>;
  getById: (
    sessionToken: string,
    terminalId: string
  ) => Promise<APIResponse & { terminal?: Terminal }>;
  update: (
    sessionToken: string,
    terminalId: string,
    updates: TerminalUpdateData
  ) => Promise<APIResponse & { terminal?: Terminal }>;
}
