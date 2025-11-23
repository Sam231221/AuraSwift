/**
 * Device ID utility - generates and stores a unique device identifier
 */

const DEVICE_ID_KEY = "aura_swift_device_id";

/**
 * Get or create a unique device ID
 * Uses localStorage to persist across sessions
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    // Generate a unique device ID
    deviceId = `device_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

/**
 * Get device information
 */
export function getDeviceInfo(): {
  deviceId: string;
  userAgent: string;
  platform: string;
} {
  return {
    deviceId: getDeviceId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  };
}
